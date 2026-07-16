import { PantryItem, Recipe } from '../types';

export const recipes: Recipe[] = [
  {
    id: '1', title: 'Creamy Tuscan Chicken', creator: '@themoderncook', platform: 'Instagram', sourceUrl: 'https://www.instagram.com/',
    description: 'Golden chicken in a silky sun-dried tomato and spinach sauce.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1000&q=85',
    time: 28, prepTime: 10, servings: 4, difficulty: 'Easy', cuisine: 'Italian',
    calories: 486, protein: 42, carbs: 16, fat: 28, tags: ['High protein', 'Dinner', 'One pan'],
    ingredients: [
      { name: 'Chicken breast', quantity: '500 g', owned: true }, { name: 'Spinach', quantity: '2 cups', owned: true },
      { name: 'Heavy cream', quantity: '1 cup', owned: true }, { name: 'Sun-dried tomatoes', quantity: '½ cup', owned: false },
      { name: 'Garlic', quantity: '4 cloves', owned: true }, { name: 'Parmesan', quantity: '½ cup', owned: true },
    ],
    instructions: ['Season the chicken generously with salt, pepper, and Italian herbs.', 'Sear in olive oil for 5–6 minutes per side. Set aside.', 'Sauté garlic and sun-dried tomatoes, then add cream and parmesan.', 'Fold in spinach, return chicken to the pan, and simmer for 5 minutes.'],
    favorite: true, match: 83, missing: ['Sun-dried tomatoes'], note: 'Try with coconut cream for a lighter version.',
  },
  {
    id: '2', title: 'Paneer Tikka Bowl', creator: '@spiceandtwice', platform: 'Instagram', sourceUrl: 'https://www.instagram.com/',
    description: 'Smoky paneer, crunchy vegetables and mint yogurt over fragrant rice.',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=1000&q=85',
    time: 25, prepTime: 15, servings: 2, difficulty: 'Easy', cuisine: 'Indian',
    calories: 520, protein: 29, carbs: 56, fat: 22, tags: ['Vegetarian', 'Meal prep', 'High protein'],
    ingredients: [
      { name: 'Paneer', quantity: '250 g', owned: true }, { name: 'Yogurt', quantity: '¾ cup', owned: true },
      { name: 'Basmati rice', quantity: '1 cup', owned: true }, { name: 'Capsicum', quantity: '1', owned: false },
      { name: 'Red onion', quantity: '1', owned: true }, { name: 'Tikka masala', quantity: '2 tbsp', owned: true },
    ],
    instructions: ['Coat paneer and vegetables in yogurt, tikka masala, and salt.', 'Air fry or roast at 210°C until the edges are charred.', 'Whisk yogurt with mint, lime, and a pinch of salt.', 'Layer rice, paneer tikka, vegetables, and mint yogurt.'],
    favorite: false, match: 83, missing: ['Capsicum'],
  },
  {
    id: '3', title: 'Miso Butter Noodles', creator: '@halfbakedharvest', platform: 'TikTok', sourceUrl: 'https://www.tiktok.com/',
    description: 'Glossy, savory noodles with a deeply comforting miso butter sauce.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1000&q=85',
    time: 15, prepTime: 5, servings: 2, difficulty: 'Easy', cuisine: 'Asian',
    calories: 410, protein: 13, carbs: 61, fat: 14, tags: ['Quick', 'Vegetarian', 'Under 20 min'],
    ingredients: [
      { name: 'Noodles', quantity: '200 g', owned: true }, { name: 'White miso', quantity: '2 tbsp', owned: true },
      { name: 'Butter', quantity: '2 tbsp', owned: true }, { name: 'Soy sauce', quantity: '1 tbsp', owned: true },
      { name: 'Spring onion', quantity: '2', owned: true },
    ],
    instructions: ['Cook noodles until just shy of al dente. Reserve one cup of water.', 'Melt butter, whisk in miso and soy sauce.', 'Toss noodles through the sauce, loosening with noodle water.', 'Finish with spring onion, sesame, and chili crisp.'],
    favorite: true, match: 100, missing: [],
  },
  {
    id: '4', title: 'Crispy Smashed Potatoes', creator: '@feelgoodfoodie', platform: 'YouTube', sourceUrl: 'https://www.youtube.com/shorts/',
    description: 'Craggy, golden potatoes with a bright garlic herb drizzle.',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1000&q=85',
    time: 40, prepTime: 8, servings: 4, difficulty: 'Easy', cuisine: 'Modern',
    calories: 260, protein: 5, carbs: 37, fat: 11, tags: ['Vegan', 'Gluten free', 'Snack'],
    ingredients: [
      { name: 'Baby potatoes', quantity: '700 g', owned: true }, { name: 'Olive oil', quantity: '3 tbsp', owned: true },
      { name: 'Garlic', quantity: '3 cloves', owned: true }, { name: 'Parsley', quantity: '¼ cup', owned: true },
    ],
    instructions: ['Boil potatoes in salted water until fork tender.', 'Arrange on a tray and smash each potato with the base of a glass.', 'Drizzle with oil, season, and roast at 220°C for 25 minutes.', 'Spoon over garlic parsley oil while hot.'],
    favorite: false, match: 100, missing: [],
  },
  {
    id: '5', title: 'Mango Chia Breakfast', creator: '@plantyou', platform: 'Instagram', sourceUrl: 'https://www.instagram.com/',
    description: 'A sunny make-ahead breakfast with coconut and fresh mango.',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1000&q=85',
    time: 8, prepTime: 8, servings: 2, difficulty: 'Easy', cuisine: 'Modern',
    calories: 310, protein: 9, carbs: 42, fat: 13, tags: ['Vegan', 'Breakfast', 'Meal prep'],
    ingredients: [
      { name: 'Chia seeds', quantity: '½ cup', owned: true }, { name: 'Coconut milk', quantity: '1½ cups', owned: false },
      { name: 'Mango', quantity: '1', owned: true }, { name: 'Maple syrup', quantity: '1 tbsp', owned: false },
    ],
    instructions: ['Whisk chia seeds, coconut milk, and maple syrup.', 'Rest for 10 minutes, whisk again, then chill overnight.', 'Blend half the mango into a smooth purée.', 'Layer chia pudding and mango in jars.'],
    favorite: false, match: 50, missing: ['Coconut milk', 'Maple syrup'],
  },
  {
    id: '6', title: 'Hot Honey Salmon', creator: '@moribyan', platform: 'TikTok', sourceUrl: 'https://www.tiktok.com/',
    description: 'Caramelized salmon with a spicy-sweet glaze and lime.',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=85',
    time: 22, prepTime: 8, servings: 2, difficulty: 'Medium', cuisine: 'American',
    calories: 448, protein: 39, carbs: 24, fat: 23, tags: ['High protein', 'Dinner', 'Quick'],
    ingredients: [
      { name: 'Salmon', quantity: '2 fillets', owned: false }, { name: 'Honey', quantity: '2 tbsp', owned: true },
      { name: 'Chili flakes', quantity: '1 tsp', owned: true }, { name: 'Lime', quantity: '1', owned: true },
      { name: 'Garlic', quantity: '2 cloves', owned: true },
    ],
    instructions: ['Mix honey, chili, garlic, lime zest, and a pinch of salt.', 'Brush over salmon and marinate for 10 minutes.', 'Bake at 210°C for 10–12 minutes.', 'Broil for the final minute, then finish with lime.'],
    favorite: true, match: 80, missing: ['Salmon'],
  },
];

export const pantry: PantryItem[] = [
  { id: 'p1', name: 'Chicken breast', icon: '🍗', quantity: '500 g', category: 'Protein', expiry: '2 days' },
  { id: 'p2', name: 'Paneer', icon: '▧', quantity: '250 g', category: 'Protein', expiry: '4 days' },
  { id: 'p3', name: 'Baby potatoes', icon: '🥔', quantity: '700 g', category: 'Vegetables' },
  { id: 'p4', name: 'Spinach', icon: '🥬', quantity: '1 bunch', category: 'Vegetables', expiry: 'Tomorrow' },
  { id: 'p5', name: 'Noodles', icon: '🍜', quantity: '400 g', category: 'Grains' },
  { id: 'p6', name: 'Mango', icon: '🥭', quantity: '2', category: 'Fruit', expiry: '3 days' },
  { id: 'p7', name: 'Yogurt', icon: '🥣', quantity: '500 g', category: 'Dairy', expiry: '5 days' },
  { id: 'p8', name: 'Garlic', icon: '🧄', quantity: '2 bulbs', category: 'Vegetables' },
];
