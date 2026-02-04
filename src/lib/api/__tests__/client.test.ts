import { describe, expect, it } from 'vitest';

import { getApiErrorDetails, parseJson } from '../client';

describe('api client helpers', () => {
  it('parses valid json responses', async () => {
    const response = new Response(JSON.stringify({ ok: true, data: { value: 1 } }));

    const body = await parseJson<{ value: number }>(response);

    expect(body).toEqual({ ok: true, data: { value: 1 } });
  });

  it('returns null when json parsing fails', async () => {
    const response = new Response('not-json');

    const body = await parseJson(response);

    expect(body).toBeNull();
  });

  it('appends recovery hints when needed', () => {
    const response = new Response('', { status: 409 });
    const body = {
      ok: false as const,
      error: { code: 'email_taken', message: 'This email is unavailable.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.recovery).toBe('update_input');
    expect(details.message).toContain('Try a different email.');
  });

  it('does not duplicate hints when already present', () => {
    const response = new Response('', { status: 400 });
    const body = {
      ok: false as const,
      error: { code: 'token_invalid', message: 'Request a new link.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.message).toBe('Request a new link.');
    expect(details.recovery).toBe('resend');
  });

  it('avoids repeating "try again" hints', () => {
    const response = new Response('', { status: 500 });
    const body = {
      ok: false as const,
      error: { code: 'internal_error', message: 'Please try again later.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.message).toBe('Please try again later.');
    expect(details.recovery).toBe('retry');
  });

  it('avoids repeating sign-in hints', () => {
    const response = new Response('', { status: 401 });
    const body = {
      ok: false as const,
      error: { code: 'unauthorized', message: 'Sign in required.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.message).toBe('Sign in required.');
    expect(details.recovery).toBe('reauth');
  });

  it('avoids repeating resend hints when already implied', () => {
    const response = new Response('', { status: 400 });
    const body = {
      ok: false as const,
      error: { code: 'token_invalid', message: 'Resend the link.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.message).toBe('Resend the link.');
    expect(details.recovery).toBe('resend');
  });

  it('avoids repeating different email hints when already stated', () => {
    const response = new Response('', { status: 409 });
    const body = {
      ok: false as const,
      error: { code: 'email_taken', message: 'Email already exists.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.message).toBe('Email already exists.');
    expect(details.recovery).toBe('update_input');
  });

  it('returns none recovery when no match', () => {
    const response = new Response('', { status: 404 });
    const body = {
      ok: false as const,
      error: { code: 'not_found', message: 'Not found.' },
    };

    const details = getApiErrorDetails(response, body);

    expect(details.recovery).toBe('none');
  });

  it('falls back to status-based messaging and recovery', () => {
    const response = new Response('', { status: 429 });

    const details = getApiErrorDetails(response, null);

    expect(details.message).toBe('Too many requests. Try again shortly.');
    expect(details.recovery).toBe('retry_later');
  });
});
