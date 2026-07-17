import { createAppError } from '../models/error.model';
import type { User, UserCreate } from '../models/user.model';
import type { UserRepository } from '../repositories/user.repository';

export const createUserService = (users: UserRepository) => ({
  get: async (id: string): Promise<User> => {
    const user = await users.findById(id);
    if (!user) throw createAppError(404, 'User not found.');
    return user;
  },
  create: async (input: UserCreate): Promise<User> => {
    const existing = await users.findByEmail(input.email);
    if (existing) return existing;
    const now = new Date().toISOString();
    const user = { id: `usr_${crypto.randomUUID()}`, ...input, createdAt: now, updatedAt: now };
    await users.create(user);
    return user;
  },
});
