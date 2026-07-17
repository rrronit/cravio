import type { AppContext } from '../models/app.model';

export const currentUserId = (context: AppContext): string => context.get('userId');
