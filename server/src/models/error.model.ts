export class AppError extends Error {
  constructor(
    public readonly status: 400 | 404 | 503,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
