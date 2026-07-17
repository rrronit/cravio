import type { User, UserRow } from '../models/user.model';

export class UserRepository {
  constructor(private readonly db: D1Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first<UserRow>();
    return row ? mapUser(row) : null;
  }

  async create(user: User): Promise<void> {
    await this.db.prepare('INSERT INTO users (id,email,name,avatar_url,created_at,updated_at) VALUES (?,?,?,?,?,?)')
      .bind(user.id, user.email, user.name, user.avatarUrl ?? null, user.createdAt, user.updatedAt).run();
  }
}

function mapUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, avatarUrl: row.avatar_url ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at };
}
