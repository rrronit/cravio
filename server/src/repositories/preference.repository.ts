import type { UserPreferences, UserPreferencesRow } from '../models/preference.model';

export const createPreferenceRepository = (db: D1Database) => ({
  findOrCreate: async (userId: string): Promise<UserPreferences> => {
    const now = new Date().toISOString();
    await db.prepare(`INSERT OR IGNORE INTO user_preferences
      (user_id,dark_mode,notifications_enabled,created_at,updated_at) VALUES (?,0,1,?,?)`)
      .bind(userId, now, now).run();
    const row = await db.prepare('SELECT dark_mode,notifications_enabled,updated_at FROM user_preferences WHERE user_id = ?')
      .bind(userId).first<UserPreferencesRow>();
    if (!row) throw new Error('User preferences could not be loaded.');
    return mapPreferences(row);
  },

  save: async (userId: string, preferences: UserPreferences): Promise<void> => {
    await db.prepare(`UPDATE user_preferences
      SET dark_mode = ?, notifications_enabled = ?, updated_at = ? WHERE user_id = ?`)
      .bind(preferences.darkMode ? 1 : 0, preferences.notificationsEnabled ? 1 : 0, preferences.updatedAt, userId).run();
  },
});

export type PreferenceRepository = ReturnType<typeof createPreferenceRepository>;

const mapPreferences = (row: UserPreferencesRow): UserPreferences => ({
  darkMode: Boolean(row.dark_mode),
  notificationsEnabled: Boolean(row.notifications_enabled),
  updatedAt: row.updated_at,
});
