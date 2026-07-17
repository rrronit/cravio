import type { AppContext } from '../models/app.model';

export const currentUserId = (context: AppContext): string => context.get('userId');

export const logApiStep = (context: AppContext, name: string, fields?: Record<string, string | number | boolean | null | undefined>): void =>
  context.get('logStep')(name, fields);
