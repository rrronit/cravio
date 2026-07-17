import { createAppError } from '../models/error.model';
import type { PantryCreate, PantryItem, PantryUpdate } from '../models/pantry.model';
import type { PantryRepository } from '../repositories/pantry.repository';

export const createPantryService = (pantry: PantryRepository) => {
  const get = async (id: string, userId: string): Promise<PantryItem> => {
    const item = await pantry.findById(id, userId);
    if (!item) throw createAppError(404, 'Pantry item not found.');
    return item;
  };
  return {
    list: (userId: string): Promise<PantryItem[]> => pantry.findAll(userId, true),
    get,
    create: async (input: PantryCreate, userId: string): Promise<PantryItem> => {
      const item = { id: `pan_${crypto.randomUUID()}`, available: true, ...input };
      await pantry.save(item, userId);
      return item;
    },
    update: async (id: string, input: PantryUpdate, userId: string): Promise<PantryItem> => {
      const updated = { ...await get(id, userId), ...input };
      await pantry.save(updated, userId);
      return updated;
    },
    delete: async (id: string, userId: string): Promise<void> => {
      await get(id, userId);
      await pantry.delete(id, userId);
    },
  };
};
