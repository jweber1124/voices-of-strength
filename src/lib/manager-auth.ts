'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const COOKIE_NAME = 'vos_manager';
const SHORT_SESSION = 60 * 60; // 1 hour (default after login)
const LONG_SESSION = 60 * 60 * 8; // 8 hours ("Stay logged in" extension)

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function login(formData: FormData) {
  const password = formData.get('password')?.toString() ?? '';
  const expected = process.env.MANAGER_PASSWORD;

  if (!expected) {
    throw new Error(
      'Server misconfiguration: MANAGER_PASSWORD environment variable is not set.',
    );
  }

  if (password !== expected) {
    const next = formData.get('next')?.toString() ?? '';
    const params = new URLSearchParams({ error: '1' });
    if (next) params.set('next', next);
    redirect(`/manager/login?${params.toString()}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '1', cookieOptions(SHORT_SESSION));

  const next = formData.get('next')?.toString() || '/manager';
  redirect(next);
}

export async function extendSession() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing !== '1') {
    redirect('/manager/login');
  }
  cookieStore.set(COOKIE_NAME, '1', cookieOptions(LONG_SESSION));
  revalidatePath('/manager');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/manager/login');
}
