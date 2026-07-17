import { createAppError } from '../models/error.model';
import type { ShoppingListCreate, ShoppingListItem } from '../models/shopping-list.model';
import type { ShoppingListRepository } from '../repositories/shopping-list.repository';

export const createShoppingListService = (shoppingList: ShoppingListRepository) => ({
  list: (userId: string): Promise<ShoppingListItem[]> => shoppingList.findAll(userId),
  create: (input: ShoppingListCreate, userId: string): Promise<ShoppingListItem> => shoppingList.upsert({
    id: `shop_${crypto.randomUUID()}`,
    ...input,
    createdAt: new Date().toISOString(),
  }, userId),
  delete: async (id: string, userId: string): Promise<void> => {
    if (!await shoppingList.findById(id, userId)) throw createAppError(404, 'Shopping list item not found.');
    await shoppingList.delete(id, userId);
  },
});

export type ShoppingListService = ReturnType<typeof createShoppingListService>;
