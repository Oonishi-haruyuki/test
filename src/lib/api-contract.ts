export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return { ok: true, data, ...(meta ? { meta } : {}) };
}

export function apiFailure(code: string, message: string, details?: unknown): ApiFailure {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(typeof details === 'undefined' ? {} : { details }),
    },
  };
}
