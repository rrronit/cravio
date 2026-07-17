import type { Recommendation, RecommendationCategory } from '../models/recommendation.model';
import type { PantryRepository } from '../repositories/pantry.repository';
import type { RecipeRepository } from '../repositories/recipe.repository';
import { normalizeIngredient } from './ingredient.service';

export const createRecommendationService = (recipes: RecipeRepository, pantry: PantryRepository) => ({
  list: async (userId: string, category?: RecommendationCategory): Promise<Recommendation[]> => {
    const [recipeList, pantryItems] = await Promise.all([recipes.findAll(userId), pantry.findAll(true)]);
    const owned = new Set(pantryItems.map((item) => normalizeIngredient(item.name)));
    return recipeList.map((recipe): Recommendation => {
      const required = recipe.ingredients.filter((item) => !item.optional);
      const missing = required.filter((item) => !owned.has(normalizeIngredient(item.name))).map((item) => item.name);
      const match = Math.round(((required.length - missing.length) / Math.max(required.length, 1)) * 100);
      const recommendationCategory: RecommendationCategory = match === 100 ? 'can_make_now' : missing.length <= 2 ? 'almost_ready' : match >= 50 ? 'best_matches' : 'need_shopping';
      return { recipe, match, missing, category: recommendationCategory };
    }).filter((item) => !category || item.category === category).sort((a, b) => b.match - a.match);
  },
});
