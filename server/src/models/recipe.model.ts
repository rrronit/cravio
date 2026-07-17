import { z } from 'zod';

export const ingredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  optional: z.boolean().optional(),
});

export const nutritionSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  estimated: z.boolean(),
});

export const recipeUpdateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
  creator: z.string(),
  sourceUrl: z.string().url(),
  prepTime: z.number().nonnegative(),
  cookTime: z.number().nonnegative(),
  servings: z.number().int().positive(),
  cuisine: z.string(),
  difficulty: z.string(),
  tags: z.array(z.string()),
  ingredients: z.array(ingredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  nutrition: nutritionSchema,
  favorite: z.boolean(),
  warnings: z.array(z.string()),
}).partial();

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Nutrition = z.infer<typeof nutritionSchema>;
export type RecipeUpdate = z.infer<typeof recipeUpdateSchema>;

export type Recipe = {
  id: string;
  userId: string;
  title: string;
  description: string;
  creator: string;
  platform: string;
  sourceUrl: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  cuisine: string;
  difficulty: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  favorite: boolean;
  confidence: number;
  warnings: string[];
  importedAt: string;
};

export type RecipeRow = {
  id: string; user_id: string; title: string; description: string; creator: string; platform: string; source_url: string; image: string;
  prep_time: number; cook_time: number; servings: number; cuisine: string; difficulty: string; tags_json: string;
  ingredients_json: string; instructions_json: string; nutrition_json: string; favorite: number; confidence: number;
  warnings_json: string; imported_at: string;
};
