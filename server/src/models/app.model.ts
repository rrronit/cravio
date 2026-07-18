import type { Context } from 'hono';
import type { ApiStepLogger } from '../lib/logger';
import type { ImportQueueMessage } from './import.model';

export type Bindings = {
  DB: D1Database;
  EMAIL?: SendEmail;
  AUTH_SECRET: string;
  EMAIL_FROM: string;
  ENVIRONMENT: 'development' | 'production';
  IMPORT_QUEUE: Queue<ImportQueueMessage>;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    userId: string;
    requestId: string;
    logStep: ApiStepLogger;
  };
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
