import { NextResponse } from 'next/server';

import type { ApiError } from './errors';

export function jsonOk<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(error: ApiError): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code: error.code, message: error.message } },
    { status: error.status },
  );
}
