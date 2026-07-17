import { ImportRepository } from '../repositories/import.repository';
import { PantryRepository } from '../repositories/pantry.repository';
import { RecipeRepository } from '../repositories/recipe.repository';
import { UserRepository } from '../repositories/user.repository';
import { HealthService } from './health.service';
import { ImportService } from './import.service';
import { IngredientService } from './ingredient.service';
import { PantryService } from './pantry.service';
import { RecipeService } from './recipe.service';
import { RecommendationService } from './recommendation.service';
import { UserService } from './user.service';

export function createServices(db: D1Database) {
  const recipes = new RecipeRepository(db);
  const pantry = new PantryRepository(db);
  const imports = new ImportRepository(db);
  const users = new UserRepository(db);
  return {
    health: new HealthService(db),
    recipes: new RecipeService(recipes),
    pantry: new PantryService(pantry),
    imports: new ImportService(imports, recipes),
    ingredients: new IngredientService(recipes),
    recommendations: new RecommendationService(recipes, pantry),
    users: new UserService(users),
  };
}

export type Services = ReturnType<typeof createServices>;
