'use server'

import { cookies } from 'next/headers'

export async function logout() {
  const cookie = await cookies();
  cookie.set('auth_token', '', { expires: new Date(0) });
  return { success: true }
}