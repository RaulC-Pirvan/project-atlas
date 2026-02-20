import { type LogContext, logError, logInfo, serializeError } from './logger';

type ApiLogOptions = {
  route?: string;
};

type ApiErrorResult = {
  response: Response;
  errorCode?: string;
};

const requestIdStore = new WeakMap<Request, string>();

export function getRequestId(request: Request) {
  const existing = requestIdStore.get(request);
  if (existing) return existing;

  const headerId = request.headers.get('x-request-id') ?? request.headers.get('x-correlation-id');
  const generated = headerId && headerId.length <= 128 ? headerId : crypto.randomUUID();
  requestIdStore.set(request, generated);
  return generated;
}

function getBaseContext(request: Request, options?: ApiLogOptions): LogContext {
  const { pathname } = new URL(request.url);
  const route = options?.route ?? pathname;

  return {
    requestId: getRequestId(request),
    method: request.method,
    path: pathname,
    route,
  };
}

export async function withApiLogging(
  request: Request,
  options: ApiLogOptions,
  handler: () => Promise<Response>,
  onError?: (error: unknown) => ApiErrorResult,
) {
  const startedAt = Date.now();
  const baseContext = getBaseContext(request, options);

  try {
    const response = await handler();
    logInfo('api.request', {
      ...baseContext,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });
    return response;
  } catch (error) {
    if (onError) {
      const { response, errorCode } = onError(error);
      logError('api.error', {
        ...baseContext,
        status: response.status,
        durationMs: Date.now() - startedAt,
        errorCode,
        ...serializeError(error),
      });
      return response;
    }

    logError('api.error', {
      ...baseContext,
      status: 500,
      durationMs: Date.now() - startedAt,
      ...serializeError(error),
    });

    throw error;
  }
}
