import { z } from 'zod';
import type { Recipe } from './recipe.model';

export const recommendationCategorySchema = z.enum([
  'can_make_now',
  'almost_ready',
  'best_matches',
  'need_shopping',
]);

export type RecommendationCategory = z.infer<typeof recommendationCategorySchema>;

export type Recommendation = {
  recipe: Recipe;
  match: number;
  missing: string[];
  category: RecommendationCategory;
};
