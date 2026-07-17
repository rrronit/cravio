import type { RecipeRepository } from '../repositories/recipe.repository';

export class IngredientService {
  constructor(private readonly recipes: RecipeRepository) {}

  async list(userId: string) {
    const counts = new Map<string, { name: string; recipeIds: string[] }>();
    for (const recipe of await this.recipes.findAll(userId)) {
      for (const ingredient of recipe.ingredients) {
        const canonical = normalizeIngredient(ingredient.name);
        const current = counts.get(canonical) ?? {
          name: canonical.replace(/\b\w/g, (letter) => letter.toUpperCase()),
          recipeIds: [],
        };
        if (!current.recipeIds.includes(recipe.id)) current.recipeIds.push(recipe.id);
        counts.set(canonical, current);
      }
    }
    return [...counts.values()]
      .map((item) => ({ ...item, recipeCount: item.recipeIds.length }))
      .sort((a, b) => b.recipeCount - a.recipeCount);
  }
}

export function normalizeIngredient(name: string) {
  const aliases: Record<string, string> = {
    curd: 'yogurt',
    'greek yogurt': 'yogurt',
    'bell pepper': 'capsicum',
    'bell peppers': 'capsicum',
    'coriander leaves': 'cilantro',
    coriander: 'cilantro',
    scallion: 'spring onion',
    scallions: 'spring onion',
  };
  const normalized = name.trim().toLowerCase();
  return aliases[normalized] ?? normalized;
}
