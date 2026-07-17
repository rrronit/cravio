import type { AppContext } from '../models/app.model';
import { recommendationCategorySchema } from '../models/recommendation.model';
import { createServices } from '../services/container';
import { currentUserId, logApiStep } from '../lib/auth';

export async function listRecommendations(c: AppContext) {
  logApiStep(c, 'recommendations.list.validation_started');
  const category = recommendationCategorySchema.optional().safeParse(c.req.query('category'));
  if (!category.success) {
    logApiStep(c, 'recommendations.list.validation_failed');
    return c.json({ error: 'Unknown recommendation category.' }, 400);
  }
  logApiStep(c, 'recommendations.list.query_started', { category: category.data ?? 'all' });
  const data = await createServices(c.env.DB).recommendations.list(currentUserId(c), category.data);
  logApiStep(c, 'recommendations.list.query_completed', { resultCount: data.length });
  return c.json({ data, total: data.length });
}
