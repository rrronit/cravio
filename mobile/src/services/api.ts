import { Platform } from 'react-native';
import { PantryItem, Recipe } from '../types';

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

export type UserPreferences = {
  darkMode: boolean;
  notificationsEnabled: boolean;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  icon: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
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

export async function requestEmailOtp(email: string): Promise<{ message: string; expiresIn: number; devCode?: string }> {
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

export async function getPreferences(): Promise<UserPreferences> {
  return request('/preferences');
}

export async function updatePreferences(input: Partial<Pick<UserPreferences, 'darkMode' | 'notificationsEnabled'>>): Promise<UserPreferences> {
  return request('/preferences', { method: 'PUT', body: JSON.stringify(input) });
}

export async function listNotifications(): Promise<{ data: AppNotification[]; total: number; unread: number }> {
  return request('/notifications');
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  return request('/notifications/read-all', { method: 'PUT' });
}

type ApiRecipe = {
  id: string; title: string; description: string; creator: string; platform: string; sourceUrl: string; image: string;
  prepTime: number; cookTime: number; servings: number; cuisine: string; difficulty: string; tags: string[];
  ingredients: { name: string; quantity: string }[]; instructions: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number }; favorite: boolean;
};

type ApiPantryItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  expiry?: string;
  available: boolean;
};

type ApiRecommendation = {
  recipe: ApiRecipe;
  match: number;
  missing: string[];
  category: 'can_make_now' | 'almost_ready' | 'best_matches' | 'need_shopping';
};

type DataResponse<T> = { data: T[]; total: number };

export async function createImport(url: string, signal?: AbortSignal): Promise<ImportJob> {
  return request<ImportJob>('/imports', { method: 'POST', body: JSON.stringify({ url }), signal });
}

export async function getImport(id: string, signal?: AbortSignal): Promise<ImportJob> {
  return request<ImportJob>(`/imports/${id}`, { signal });
}

export async function getImportedRecipe(id: string, signal?: AbortSignal): Promise<Recipe> {
  const recipe = await request<ApiRecipe>(`/recipes/${id}`, { signal });
  return mapRecipe(recipe);
}

export async function listRecipes(): Promise<Recipe[]> {
  const result = await request<DataResponse<ApiRecipe>>('/recipes');
  return result.data.map((recipe) => mapRecipe(recipe));
}

export async function listPantry(): Promise<PantryItem[]> {
  const result = await request<DataResponse<ApiPantryItem>>('/pantry');
  return result.data.map(mapPantryItem);
}

export async function listRecommendations(): Promise<Recipe[]> {
  const result = await request<DataResponse<ApiRecommendation>>('/recommendations');
  return result.data.map(({ recipe, match, missing }) => mapRecipe(recipe, match, missing));
}

export async function updateRecipeFavorite(id: string, favorite: boolean): Promise<void> {
  await request<ApiRecipe>(`/recipes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ favorite }),
  });
}

export async function createPantryItem(item: Pick<PantryItem, 'name' | 'quantity' | 'expiry'>): Promise<PantryItem> {
  const parsed = parseQuantity(item.quantity);
  const result = await request<ApiPantryItem>('/pantry', {
    method: 'POST',
    body: JSON.stringify({ name: item.name, ...parsed, ...(item.expiry ? { expiry: item.expiry } : {}) }),
  });
  return mapPantryItem(result);
}

export async function addShoppingListItem(name: string, quantity?: string): Promise<void> {
  await request('/shopping-list', {
    method: 'POST',
    body: JSON.stringify({ name, ...(quantity ? { quantity } : {}) }),
  });
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

function mapRecipe(recipe: ApiRecipe, match = 0, missing: string[] = recipe.ingredients.map((item) => item.name)): Recipe {
  const missingNames = new Set(missing.map((name) => name.toLowerCase()));
  return {
    id: recipe.id, title: recipe.title, description: recipe.description, creator: recipe.creator,
    platform: normalizePlatform(recipe.platform), sourceUrl: recipe.sourceUrl, image: recipe.image,
    prepTime: recipe.prepTime, time: recipe.cookTime, servings: recipe.servings,
    difficulty: recipe.difficulty === 'Hard' ? 'Hard' : recipe.difficulty === 'Medium' ? 'Medium' : 'Easy',
    cuisine: recipe.cuisine, calories: recipe.nutrition.calories, protein: recipe.nutrition.protein,
    carbs: recipe.nutrition.carbs, fat: recipe.nutrition.fat, tags: recipe.tags,
    ingredients: recipe.ingredients.map((item) => ({ ...item, owned: !missingNames.has(item.name.toLowerCase()) })),
    instructions: recipe.instructions, favorite: recipe.favorite, match, missing,
  };
}

function mapPantryItem(item: ApiPantryItem): PantryItem {
  const amount = item.quantity == null ? '' : `${item.quantity}`;
  return {
    id: item.id,
    name: item.name,
    quantity: [amount, item.unit].filter(Boolean).join(' ') || 'On hand',
    category: 'Pantry',
    icon: pantryIcon(item.name),
    expiry: item.expiry,
  };
}

function parseQuantity(value: string): { quantity?: number; unit?: string } {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return value.trim() ? { unit: value.trim() } : {};
  const quantity = Number(match[1]);
  const unit = match[2]?.trim();
  return { quantity, ...(unit ? { unit } : {}) };
}

function pantryIcon(name: string): string {
  const value = name.toLowerCase();
  if (/tomato|pepper/.test(value)) return '🍅';
  if (/spinach|lettuce|herb|basil/.test(value)) return '🥬';
  if (/milk|cream|yogurt/.test(value)) return '🥛';
  if (/egg/.test(value)) return '🥚';
  if (/cheese|paneer/.test(value)) return '🧀';
  if (/onion|garlic/.test(value)) return '🧅';
  return '🥕';
}
