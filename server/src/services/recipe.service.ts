import { AppError } from '../models/error.model';
import type { Recipe, RecipeUpdate } from '../models/recipe.model';
import type { RecipeRepository } from '../repositories/recipe.repository';

export class RecipeService {
  constructor(private readonly recipes: RecipeRepository) {}

  async list(userId: string, query = '', favorite = false): Promise<Recipe[]> {
    const needle = query.trim().toLowerCase();
    return (await this.recipes.findAll(userId)).filter((recipe) => {
      const searchable = `${recipe.title} ${recipe.creator} ${recipe.cuisine} ${recipe.tags.join(' ')} ${recipe.ingredients.map((item) => item.name).join(' ')}`.toLowerCase();
      return (!needle || searchable.includes(needle)) && (!favorite || recipe.favorite);
    });
  }

  async get(id: string, userId: string): Promise<Recipe> {
    const recipe = await this.recipes.findById(id, userId);
    if (!recipe) throw new AppError(404, 'Recipe not found.');
    return recipe;
  }

  async update(id: string, userId: string, update: RecipeUpdate): Promise<Recipe> {
    const recipe = await this.get(id, userId);
    const updated = { ...recipe, ...update };
    await this.recipes.save(updated);
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.get(id, userId);
    await this.recipes.delete(id, userId);
  }
}
