'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from './supabase';
import { CATEGORIES } from './categories';

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

  revalidatePath('/helper');
  revalidatePath('/manager');
  redirect(`/thank-you?volunteerId=${savedId}`);
}
