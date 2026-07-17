export type Recipe = {
  id: string;
  title: string;
  description: string;
  creator: string;
  platform: string;
  sourceUrl: string;
  image: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  cuisine: string;
  difficulty: string;
  tags: string[];
  ingredients: { name: string; quantity: string; optional?: boolean }[];
  instructions: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number; estimated: boolean };
  favorite: boolean;
  confidence: number;
  warnings: string[];
  importedAt: string;
};

export type PantryItem = { id: string; name: string; quantity?: number; unit?: string; expiry?: string; available: boolean };

export const recipes: Recipe[] = [
  {
    id: '1', title: 'Creamy Tuscan Chicken', description: 'Golden chicken in a silky sun-dried tomato and spinach sauce.', creator: '@themoderncook', platform: 'Instagram', sourceUrl: 'https://instagram.com/reel/demo', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d', prepTime: 10, cookTime: 28, servings: 4, cuisine: 'Italian', difficulty: 'Easy', tags: ['High protein', 'Dinner', 'One pan'],
    ingredients: [{ name: 'Chicken breast', quantity: '500 g' }, { name: 'Spinach', quantity: '2 cups' }, { name: 'Heavy cream', quantity: '1 cup' }, { name: 'Sun-dried tomatoes', quantity: '½ cup' }, { name: 'Garlic', quantity: '4 cloves' }, { name: 'Parmesan', quantity: '½ cup' }],
    instructions: ['Season the chicken.', 'Sear for 5–6 minutes per side.', 'Make the cream sauce.', 'Return chicken and simmer.'], nutrition: { calories: 486, protein: 42, carbs: 16, fat: 28, estimated: true }, favorite: true, confidence: 0.94, warnings: [], importedAt: new Date().toISOString(),
  },
  {
    id: '2', title: 'Miso Butter Noodles', description: 'Glossy, savory noodles with a comforting miso butter sauce.', creator: '@halfbakedharvest', platform: 'TikTok', sourceUrl: 'https://tiktok.com/demo', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624', prepTime: 5, cookTime: 15, servings: 2, cuisine: 'Asian', difficulty: 'Easy', tags: ['Quick', 'Vegetarian', 'Under 20 min'],
    ingredients: [{ name: 'Noodles', quantity: '200 g' }, { name: 'White miso', quantity: '2 tbsp' }, { name: 'Butter', quantity: '2 tbsp' }, { name: 'Soy sauce', quantity: '1 tbsp' }, { name: 'Spring onion', quantity: '2' }],
    instructions: ['Cook noodles.', 'Whisk the sauce.', 'Toss together.', 'Finish with spring onion.'], nutrition: { calories: 410, protein: 13, carbs: 61, fat: 14, estimated: true }, favorite: true, confidence: 0.97, warnings: [], importedAt: new Date().toISOString(),
  },
  {
    id: '3', title: 'Paneer Tikka Bowl', description: 'Smoky paneer and vegetables over fragrant rice.', creator: '@spiceandtwice', platform: 'Instagram', sourceUrl: 'https://instagram.com/reel/paneer', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8', prepTime: 15, cookTime: 25, servings: 2, cuisine: 'Indian', difficulty: 'Easy', tags: ['Vegetarian', 'Meal prep', 'High protein'],
    ingredients: [{ name: 'Paneer', quantity: '250 g' }, { name: 'Yogurt', quantity: '¾ cup' }, { name: 'Basmati rice', quantity: '1 cup' }, { name: 'Capsicum', quantity: '1' }, { name: 'Red onion', quantity: '1' }],
    instructions: ['Marinate paneer.', 'Roast until charred.', 'Make mint yogurt.', 'Assemble the bowl.'], nutrition: { calories: 520, protein: 29, carbs: 56, fat: 22, estimated: true }, favorite: false, confidence: 0.91, warnings: ['Spice quantity was inferred from the caption.'], importedAt: new Date().toISOString(),
  },
];

export const pantry: PantryItem[] = [
  { id: 'p1', name: 'Chicken breast', quantity: 500, unit: 'g', available: true }, { id: 'p2', name: 'Spinach', quantity: 1, unit: 'bunch', expiry: '2026-07-18', available: true },
  { id: 'p3', name: 'Heavy cream', quantity: 1, unit: 'cup', available: true }, { id: 'p4', name: 'Garlic', quantity: 2, unit: 'bulbs', available: true },
  { id: 'p5', name: 'Parmesan', quantity: 150, unit: 'g', available: true }, { id: 'p6', name: 'Noodles', quantity: 400, unit: 'g', available: true },
  { id: 'p7', name: 'White miso', quantity: 1, unit: 'jar', available: true }, { id: 'p8', name: 'Butter', quantity: 200, unit: 'g', available: true },
  { id: 'p9', name: 'Soy sauce', quantity: 1, unit: 'bottle', available: true }, { id: 'p10', name: 'Spring onion', quantity: 4, unit: 'stalks', available: true },
  { id: 'p11', name: 'Paneer', quantity: 250, unit: 'g', available: true }, { id: 'p12', name: 'Yogurt', quantity: 500, unit: 'g', available: true },
  { id: 'p13', name: 'Basmati rice', quantity: 1, unit: 'kg', available: true }, { id: 'p14', name: 'Red onion', quantity: 3, unit: 'items', available: true },
];

export type ImportEvent = { status: string; progress: number; at: string; message: string };
export type ImportJob = {
  id: string;
  url: string;
  platform: string;
  status: string;
  progress: number;
  recipeId?: string;
  createdAt: string;
  events: ImportEvent[];
};

export const importJobs: ImportJob[] = [];

const aliases: Record<string, string> = {
  curd: 'yogurt', 'greek yogurt': 'yogurt', 'bell pepper': 'capsicum', 'bell peppers': 'capsicum',
  'coriander leaves': 'cilantro', coriander: 'cilantro', scallion: 'spring onion', scallions: 'spring onion',
};

export const normalizeIngredient = (name: string) => aliases[name.trim().toLowerCase()] ?? name.trim().toLowerCase();

export function recommendations() {
  const owned = new Set(pantry.filter((item) => item.available).map((item) => normalizeIngredient(item.name)));
  return recipes.map((recipe) => {
    const required = recipe.ingredients.filter((item) => !item.optional);
    const missing = required.filter((item) => !owned.has(normalizeIngredient(item.name))).map((item) => item.name);
    const match = Math.round(((required.length - missing.length) / Math.max(required.length, 1)) * 100);
    return { recipe, match, missing, category: match === 100 ? 'can_make_now' : missing.length <= 2 ? 'almost_ready' : match >= 50 ? 'best_matches' : 'need_shopping' };
  }).sort((a, b) => b.match - a.match);
}
