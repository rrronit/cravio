export type AppError = Error & { status: 400 | 404 | 503; details?: unknown; isAppError: true };

export const createAppError = (status: AppError['status'], message: string, details?: unknown): AppError =>
  Object.assign(new Error(message), { status, details, isAppError: true as const });

export const isAppError = (error: unknown): error is AppError =>
  error instanceof Error && 'isAppError' in error && error.isAppError === true;
