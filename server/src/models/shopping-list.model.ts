import { z } from 'zod';

export const shoppingListCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().min(1).max(80).optional(),
});

export type ShoppingListCreate = z.infer<typeof shoppingListCreateSchema>;

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity?: string;
  createdAt: string;
};

export type ShoppingListItemRow = {
  id: string;
  name: string;
  quantity: string | null;
  created_at: string;
};
