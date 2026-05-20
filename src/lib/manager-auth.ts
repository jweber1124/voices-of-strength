'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'vos_manager';
const SEVEN_DAYS = 60 * 60 * 24 * 7;

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
  cookieStore.set(COOKIE_NAME, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS,
  });

  const next = formData.get('next')?.toString() || '/manager';
  redirect(next);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/manager/login');
}
