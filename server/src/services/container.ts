import { createImportRepository } from '../repositories/import.repository';
import { createPantryRepository } from '../repositories/pantry.repository';
import { createRecipeRepository } from '../repositories/recipe.repository';
import { createUserRepository } from '../repositories/user.repository';
import { createPreferenceRepository } from '../repositories/preference.repository';
import { createNotificationRepository } from '../repositories/notification.repository';
import { createShoppingListRepository } from '../repositories/shopping-list.repository';
import { createHealthService } from './health.service';
import { createImportService } from './import.service';
import { createIngredientService } from './ingredient.service';
import { createPantryService } from './pantry.service';
import { createRecipeService } from './recipe.service';
import { createRecommendationService } from './recommendation.service';
import { createUserService } from './user.service';
import { createPreferenceService } from './preference.service';
import { createNotificationService } from './notification.service';
import { createShoppingListService } from './shopping-list.service';

export const createServices = (db: D1Database) => {
  const recipes = createRecipeRepository(db);
  const pantry = createPantryRepository(db);
  const imports = createImportRepository(db);
  const users = createUserRepository(db);
  const preferences = createPreferenceRepository(db);
  const notifications = createNotificationRepository(db);
  const shoppingList = createShoppingListRepository(db);
  return {
    health: createHealthService(db),
    recipes: createRecipeService(recipes),
    pantry: createPantryService(pantry),
    imports: createImportService(imports, recipes),
    ingredients: createIngredientService(recipes),
    recommendations: createRecommendationService(recipes, pantry),
    users: createUserService(users),
    preferences: createPreferenceService(preferences),
    notifications: createNotificationService(notifications),
    shoppingList: createShoppingListService(shoppingList),
  };
};

export type Services = ReturnType<typeof createServices>;
