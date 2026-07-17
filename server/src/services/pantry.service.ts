import { createAppError } from '../models/error.model';
import type { PantryCreate, PantryItem, PantryUpdate } from '../models/pantry.model';
import type { PantryRepository } from '../repositories/pantry.repository';

export const createPantryService = (pantry: PantryRepository) => {
  const get = async (id: string): Promise<PantryItem> => {
    const item = await pantry.findById(id);
    if (!item) throw createAppError(404, 'Pantry item not found.');
    return item;
  };
  return {
    list: (): Promise<PantryItem[]> => pantry.findAll(true),
    get,
    create: async (input: PantryCreate): Promise<PantryItem> => {
      const item = { id: `pan_${crypto.randomUUID()}`, available: true, ...input };
      await pantry.save(item);
      return item;
    },
    update: async (id: string, input: PantryUpdate): Promise<PantryItem> => {
      const updated = { ...await get(id), ...input };
      await pantry.save(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await get(id);
      await pantry.delete(id);
    },
  };
};
