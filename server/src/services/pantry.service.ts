import { AppError } from '../models/error.model';
import type { PantryCreate, PantryItem, PantryUpdate } from '../models/pantry.model';
import type { PantryRepository } from '../repositories/pantry.repository';

export class PantryService {
  constructor(private readonly pantry: PantryRepository) {}

  list(): Promise<PantryItem[]> {
    return this.pantry.findAll(true);
  }

  async get(id: string): Promise<PantryItem> {
    const item = await this.pantry.findById(id);
    if (!item) throw new AppError(404, 'Pantry item not found.');
    return item;
  }

  async create(input: PantryCreate): Promise<PantryItem> {
    const item = { id: `pan_${crypto.randomUUID()}`, available: true, ...input };
    await this.pantry.save(item);
    return item;
  }

  async update(id: string, input: PantryUpdate): Promise<PantryItem> {
    const item = await this.get(id);
    const updated = { ...item, ...input };
    await this.pantry.save(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.pantry.delete(id);
  }
}
