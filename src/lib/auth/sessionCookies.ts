import type { NextResponse } from 'next/server';

import {
  ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
  CALLBACK_COOKIE_NAMES,
  CSRF_COOKIE_NAMES,
  SESSION_TOKEN_COOKIE_NAMES,
  shouldUseSecureAuthCookies,
} from './sessionConfig';

type MutableResponse = Pick<NextResponse, 'cookies'>;

export function clearAuthCookies(response: MutableResponse) {
  const secure = shouldUseSecureAuthCookies();

  for (const name of SESSION_TOKEN_COOKIE_NAMES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
  }

  for (const name of CSRF_COOKIE_NAMES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
  }

  for (const name of CALLBACK_COOKIE_NAMES) {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: false,
      sameSite: 'lax',
      secure,
    });
  }

  response.cookies.set({
    name: ADMIN_2FA_ENROLLMENT_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure,
  });
}
