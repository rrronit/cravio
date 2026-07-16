export type Ingredient = {
  name: string;
  quantity: string;
  owned?: boolean;
};

export type Recipe = {
  id: string;
  title: string;
  description: string;
  creator: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  image: string;
  time: number;
  prepTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  favorite: boolean;
  match: number;
  missing: string[];
  note?: string;
};

export type PantryItem = {
  id: string;
  name: string;
  icon: string;
  quantity: string;
  category: string;
  expiry?: string;
};

export type TabName = 'Home' | 'Cookbook' | 'Import' | 'Pantry' | 'Profile';
