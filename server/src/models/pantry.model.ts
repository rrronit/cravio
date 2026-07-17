import { z } from 'zod';

export const pantryCreateSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().trim().min(1).optional(),
  expiry: z.string().optional(),
});

export const pantryUpdateSchema = pantryCreateSchema.extend({
  available: z.boolean(),
}).partial();

export type PantryCreate = z.infer<typeof pantryCreateSchema>;
export type PantryUpdate = z.infer<typeof pantryUpdateSchema>;

export type PantryItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiry?: string;
  available: boolean;
};

export type PantryRow = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  expiry: string | null;
  available: number;
};
