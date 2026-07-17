import type { PreferenceUpdate, UserPreferences } from '../models/preference.model';
import type { PreferenceRepository } from '../repositories/preference.repository';

export const createPreferenceService = (preferences: PreferenceRepository) => ({
  get: (userId: string): Promise<UserPreferences> => preferences.findOrCreate(userId),
  update: async (userId: string, input: PreferenceUpdate): Promise<UserPreferences> => {
    const updated = { ...await preferences.findOrCreate(userId), ...input, updatedAt: new Date().toISOString() };
    await preferences.save(userId, updated);
    return updated;
  },
});

export type PreferenceService = ReturnType<typeof createPreferenceService>;
