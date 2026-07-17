import type { User, UserRow } from '../models/user.model';

export const createUserRepository = (db: D1Database) => ({
  findById: async (id: string): Promise<User | null> => {
    const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
    return row ? mapUser(row) : null;
  },
  findByEmail: async (email: string): Promise<User | null> => {
    const row = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first<UserRow>();
    return row ? mapUser(row) : null;
  },
  create: async (user: User): Promise<void> => {
    await db.prepare('INSERT INTO users (id,email,name,avatar_url,created_at,updated_at) VALUES (?,?,?,?,?,?)')
      .bind(user.id, user.email, user.name, user.avatarUrl ?? null, user.createdAt, user.updatedAt).run();
  },
});

export type UserRepository = ReturnType<typeof createUserRepository>;

const mapUser = (row: UserRow): User => ({
  id: row.id, email: row.email, name: row.name, avatarUrl: row.avatar_url ?? undefined,
  createdAt: row.created_at, updatedAt: row.updated_at,
});
