export type ApiErrorPayload = {
  code: string;
  message: string;
};

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiErrorPayload };

export async function parseJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export function getApiErrorMessage(response: Response, body: ApiResponse<unknown> | null): string {
  if (body && !body.ok && body.error?.message) return body.error.message;
  if (response.status === 401) return 'Invalid credentials.';
  if (response.status === 429) return 'Too many requests. Try again later.';
  return response.statusText || 'Request failed.';
}
