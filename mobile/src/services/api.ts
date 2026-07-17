import { Platform } from 'react-native';
import { Recipe } from '../types';

const localApi = Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787';
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || localApi;
let accessToken: string | null = null;

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

type ImportEvent = { status: string; progress: number; at: string; message: string };
export type ImportJob = {
  id: string;
  status: 'queued' | 'extracting' | 'generating_recipe' | 'ready' | 'failed';
  progress: number;
  recipeId?: string;
  events: ImportEvent[];
};

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function requestEmailOtp(email: string): Promise<{ message: string; expiresIn: number }> {
  return request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function verifyEmailOtp(email: string, code: string): Promise<AuthSession> {
  const result = await request<AuthSession & { accessToken?: string }>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
  const token = result.token || result.accessToken;
  if (!token) throw new Error('The server did not return a session token.');
  return { token, expiresAt: result.expiresAt, user: result.user };
}

export async function logoutSession(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return request('/auth/me');
}

type ApiRecipe = {
  id: string; title: string; description: string; creator: string; platform: string; sourceUrl: string; image: string;
  prepTime: number; cookTime: number; servings: number; cuisine: string; difficulty: string; tags: string[];
  ingredients: { name: string; quantity: string }[]; instructions: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number }; favorite: boolean;
};

export async function createImport(url: string, signal?: AbortSignal): Promise<ImportJob> {
  return request<ImportJob>('/imports', { method: 'POST', body: JSON.stringify({ url }), signal });
}

export async function getImport(id: string, signal?: AbortSignal): Promise<ImportJob> {
  return request<ImportJob>(`/imports/${id}`, { signal });
}

export async function getImportedRecipe(id: string, signal?: AbortSignal): Promise<Recipe> {
  const recipe = await request<ApiRecipe>(`/recipes/${id}`, { signal });
  return {
    id: recipe.id, title: recipe.title, description: recipe.description, creator: recipe.creator,
    platform: normalizePlatform(recipe.platform), sourceUrl: recipe.sourceUrl, image: recipe.image,
    prepTime: recipe.prepTime, time: recipe.cookTime, servings: recipe.servings,
    difficulty: recipe.difficulty === 'Hard' ? 'Hard' : recipe.difficulty === 'Medium' ? 'Medium' : 'Easy',
    cuisine: recipe.cuisine, calories: recipe.nutrition.calories, protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs, fat: recipe.nutrition.fat, tags: recipe.tags,
    ingredients: recipe.ingredients.map((item) => ({ ...item, owned: false })), instructions: recipe.instructions,
    favorite: recipe.favorite, match: 0, missing: recipe.ingredients.map((item) => item.name),
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  const body = response.status === 204 ? undefined : await response.json();
  if (!response.ok) throw new Error(body?.error || `Request failed with ${response.status}`);
  return body as T;
}

function normalizePlatform(value: string): Recipe['platform'] {
  if (value === 'TikTok' || value === 'YouTube') return value;
  return 'Instagram';
}
