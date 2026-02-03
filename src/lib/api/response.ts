import { NextResponse } from 'next/server';

import { type ApiError, getApiErrorRecovery } from './errors';

export function jsonOk<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(error: ApiError): NextResponse {
  const recovery = error.recovery ?? getApiErrorRecovery(error.code, error.status);

  return NextResponse.json(
    { ok: false, error: { code: error.code, message: error.message, recovery } },
    { status: error.status },
  );
}
