import { z } from 'zod';

export const preferenceUpdateSchema = z.object({
  darkMode: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one preference is required.');

export type PreferenceUpdate = z.infer<typeof preferenceUpdateSchema>;

export type UserPreferences = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  updatedAt: string;
};

export type UserPreferencesRow = {
  dark_mode: number;
  notifications_enabled: number;
  updated_at: string;
};
