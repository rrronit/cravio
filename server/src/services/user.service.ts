import { AppError } from '../models/error.model';
import type { User, UserCreate } from '../models/user.model';
import type { UserRepository } from '../repositories/user.repository';

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async get(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new AppError(404, 'User not found.');
    return user;
  }

  async create(input: UserCreate): Promise<User> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) return existing;
    const now = new Date().toISOString();
    const user = { id: `usr_${crypto.randomUUID()}`, ...input, createdAt: now, updatedAt: now };
    await this.users.create(user);
    return user;
  }
}
