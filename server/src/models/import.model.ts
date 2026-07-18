import { z } from 'zod';

export const importCreateSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
});

export const importStatuses = ['queued', 'extracting', 'generating_recipe', 'ready', 'failed'] as const;
export type ImportStatus = typeof importStatuses[number];

export type ImportEvent = {
  status: ImportStatus;
  progress: number;
  at: string;
  message: string;
};

export type ImportJob = {
  id: string;
  userId: string;
  url: string;
  platform: string;
  status: ImportStatus;
  progress: number;
  recipeId?: string;
  createdAt: string;
  caption?: string;
  extraction?: SourceExtraction;
  errorMessage?: string;
  events: ImportEvent[];
};

export type SourceExtraction = {
  title: string;
  creator: string;
  description: string;
  thumbnail: string;
  provider: string;
};

export type ImportJobRow = {
  id: string;
  user_id: string;
  url: string;
  platform: string;
  status: ImportStatus;
  progress: number;
  recipe_id: string | null;
  created_at: string;
  caption: string | null;
  extraction_json: string | null;
  error_message: string | null;
};

export type ImportEventRow = {
  status: ImportStatus;
  progress: number;
  message: string;
  created_at: string;
};

export type ImportCreate = z.infer<typeof importCreateSchema>;

export type ImportQueueMessage = {
  id: string;
  userId: string;
};
