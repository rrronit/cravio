import type { AppContext } from '../models/app.model';
import { recommendationCategorySchema } from '../models/recommendation.model';
import { createServices } from '../services/container';
import { currentUserId } from '../lib/auth';

export async function listRecommendations(c: AppContext) {
  const category = recommendationCategorySchema.optional().safeParse(c.req.query('category'));
  if (!category.success) return c.json({ error: 'Unknown recommendation category.' }, 400);
  const data = await createServices(c.env.DB).recommendations.list(currentUserId(c), category.data);
  return c.json({ data, total: data.length });
}
