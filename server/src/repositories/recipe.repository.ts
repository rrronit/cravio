import type { Recipe, RecipeRow } from '../models/recipe.model';

export class RecipeRepository {
  constructor(private readonly db: D1Database) {}

  async findAll(userId: string): Promise<Recipe[]> {
    const { results } = await this.db.prepare('SELECT * FROM recipes WHERE user_id = ? ORDER BY imported_at DESC').bind(userId).all<RecipeRow>();
    return results.map(mapRecipeRow);
  }

  async findById(id: string, userId: string): Promise<Recipe | null> {
    const row = await this.db.prepare('SELECT * FROM recipes WHERE id = ? AND user_id = ?').bind(id, userId).first<RecipeRow>();
    return row ? mapRecipeRow(row) : null;
  }

  async findTemplate(): Promise<Recipe | null> {
    const row = await this.db.prepare('SELECT * FROM recipes ORDER BY imported_at LIMIT 1').first<RecipeRow>();
    return row ? mapRecipeRow(row) : null;
  }

  async save(recipe: Recipe): Promise<void> {
    await this.db.prepare(`INSERT OR REPLACE INTO recipes
      (id,user_id,title,description,creator,platform,source_url,image,prep_time,cook_time,servings,cuisine,difficulty,tags_json,ingredients_json,instructions_json,nutrition_json,favorite,confidence,warnings_json,imported_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        recipe.id, recipe.userId, recipe.title, recipe.description, recipe.creator, recipe.platform, recipe.sourceUrl, recipe.image,
        recipe.prepTime, recipe.cookTime, recipe.servings, recipe.cuisine, recipe.difficulty, JSON.stringify(recipe.tags),
        JSON.stringify(recipe.ingredients), JSON.stringify(recipe.instructions), JSON.stringify(recipe.nutrition),
        recipe.favorite ? 1 : 0, recipe.confidence, JSON.stringify(recipe.warnings), recipe.importedAt,
      ).run();
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?').bind(id, userId).run();
  }
}

function mapRecipeRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    creator: row.creator,
    platform: row.platform,
    sourceUrl: row.source_url,
    image: row.image,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    cuisine: row.cuisine,
    difficulty: row.difficulty,
    tags: parseJson(row.tags_json, []),
    ingredients: parseJson(row.ingredients_json, []),
    instructions: parseJson(row.instructions_json, []),
    nutrition: parseJson(row.nutrition_json, { calories: 0, protein: 0, carbs: 0, fat: 0, estimated: true }),
    favorite: Boolean(row.favorite),
    confidence: row.confidence,
    warnings: parseJson(row.warnings_json, []),
    importedAt: row.imported_at,
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
