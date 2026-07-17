import type { Context } from 'hono';

export type Bindings = {
  DB: D1Database;
};

export type AppEnv = {
  Bindings: Bindings;
};

export type AppContext = Context<AppEnv>;

export type ListResponse<T> = {
  data: T[];
  total: number;
};

export type ApiError = {
  error: string;
  details?: unknown;
};
