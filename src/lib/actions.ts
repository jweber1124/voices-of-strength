'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';
import { CATEGORIES } from './categories';
import { sendConfirmationEmail, sendCancellationEmails } from './email';

async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get('host');
  if (!host) return '';
  const proto =
    h.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}

export async function submitSignup(formData: FormData) {
  const volunteerId = formData.get('volunteer_id')?.toString().trim() || null;

  const { data: events, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('status', 'current')
    .limit(1);
  if (eventError) throw new Error(eventError.message);
  if (!events || events.length === 0) {
    throw new Error('No current event found. Ask the event manager to create one.');
  }
  const eventId = events[0].id;

  const firstName = formData.get('first_name')?.toString().trim() ?? '';
  const lastName = formData.get('last_name')?.toString().trim() ?? '';
  const arrivalTime = formData.get('arrival_time')?.toString().trim() || null;
  const departureTime = formData.get('departure_time')?.toString().trim() || null;
  const cell = formData.get('cell')?.toString().trim() ?? '';
  const email = formData.get('email')?.toString().trim() ?? '';
  const note = (formData.get('note')?.toString().trim() ?? '').slice(0, 250);

  if (!firstName || !lastName || !cell || !email || !arrivalTime || !departureTime) {
    throw new Error('Please fill out all required fields.');
  }

  const validIds = new Set(CATEGORIES.map((c) => c.id));
  const categories = formData
    .getAll('categories')
    .map((c) => c.toString())
    .filter((c) => validIds.has(c));

  const row = {
    event_id: eventId,
    first_name: firstName,
    last_name: lastName,
    arrival_time: arrivalTime,
    departure_time: departureTime,
    cell,
    email,
    categories,
    note: note || null,
    updated_at: new Date().toISOString(),
  };

  let savedId: string;
  if (volunteerId) {
    const { data, error } = await supabase
      .from('volunteers')
      .update(row)
      .eq('id', volunteerId)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    savedId = data.id;
  } else {
    const { data, error } = await supabase
      .from('volunteers')
      .insert(row)
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    savedId = data.id;
  }

  // Send confirmation email (don't block redirect on email failure).
  const baseUrl = await getBaseUrl();
  if (baseUrl && email) {
    await sendConfirmationEmail(
      {
        id: savedId,
        first_name: firstName,
        email,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        categories,
      },
      baseUrl,
      Boolean(volunteerId),
    );
  }

  revalidatePath('/helper');
  revalidatePath('/manager');
  redirect(`/thank-you?volunteerId=${savedId}`);
}

export async function cancelSignup(formData: FormData) {
  const volunteerId = formData.get('volunteer_id')?.toString().trim();
  if (!volunteerId) throw new Error('Missing volunteer id');

  // Read the full row BEFORE deleting (we need it for the notification emails).
  const { data: vol, error: readError } = await supabaseAdmin
    .from('volunteers')
    .select('*')
    .eq('id', volunteerId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!vol) {
    // Already deleted (e.g. double-submit) — just send the user to the done page.
    redirect('/helper/cancel?status=done');
  }

  const baseUrl = await getBaseUrl();
  if (baseUrl) {
    await sendCancellationEmails(
      {
        id: vol.id as string,
        first_name: vol.first_name as string,
        last_name: vol.last_name as string,
        email: (vol.email as string | null) ?? '',
        arrival_time: vol.arrival_time
          ? (vol.arrival_time as string).slice(0, 5)
          : null,
        departure_time: vol.departure_time
          ? (vol.departure_time as string).slice(0, 5)
          : null,
        categories: (vol.categories ?? []) as string[],
        cell: (vol.cell as string | null) ?? null,
        note: (vol.note as string | null) ?? null,
      },
      baseUrl,
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from('volunteers')
    .delete()
    .eq('id', volunteerId);

  // Even if the delete somehow errors, we've already sent the emails. Surface
  // the failure to the user so they know something's off.
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath('/helper');
  revalidatePath('/manager');
  redirect('/helper/cancel?status=done');
}
