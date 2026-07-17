import { createAppError } from '../models/error.model';
import type { Recipe, RecipeUpdate } from '../models/recipe.model';
import type { RecipeRepository } from '../repositories/recipe.repository';

export const createRecipeService = (recipes: RecipeRepository) => {
  const list = async (userId: string, query = '', favorite = false): Promise<Recipe[]> => {
    const needle = query.trim().toLowerCase();
    return (await recipes.findAll(userId)).filter((recipe) => {
      const searchable = `${recipe.title} ${recipe.creator} ${recipe.cuisine} ${recipe.tags.join(' ')} ${recipe.ingredients.map((item) => item.name).join(' ')}`.toLowerCase();
      return (!needle || searchable.includes(needle)) && (!favorite || recipe.favorite);
    });
  };
  const get = async (id: string, userId: string): Promise<Recipe> => {
    const recipe = await recipes.findById(id, userId);
    if (!recipe) throw createAppError(404, 'Recipe not found.');
    return recipe;
  };
  return {
    list,
    get,
    update: async (id: string, userId: string, update: RecipeUpdate): Promise<Recipe> => {
      const updated = { ...await get(id, userId), ...update };
      await recipes.save(updated);
      return updated;
    },
    delete: async (id: string, userId: string): Promise<void> => {
      await get(id, userId);
      await recipes.delete(id, userId);
    },
  };
};
