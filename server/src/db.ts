export type Recipe = {
  id: string; title: string; description: string; creator: string; platform: string; sourceUrl: string; image: string;
  prepTime: number; cookTime: number; servings: number; cuisine: string; difficulty: string; tags: string[];
  ingredients: { name: string; quantity: string; optional?: boolean }[]; instructions: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number; estimated: boolean };
  favorite: boolean; confidence: number; warnings: string[]; importedAt: string;
};

export type PantryItem = { id: string; name: string; quantity?: number; unit?: string; expiry?: string; available: boolean };
export type ImportEvent = { status: string; progress: number; at: string; message: string };
export type ImportJob = { id: string; url: string; platform: string; status: string; progress: number; recipeId?: string; createdAt: string; events: ImportEvent[] };

type RecipeRow = {
  id: string; title: string; description: string; creator: string; platform: string; source_url: string; image: string;
  prep_time: number; cook_time: number; servings: number; cuisine: string; difficulty: string; tags_json: string;
  ingredients_json: string; instructions_json: string; nutrition_json: string; favorite: number; confidence: number;
  warnings_json: string; imported_at: string;
};
type PantryRow = { id: string; name: string; quantity: number | null; unit: string | null; expiry: string | null; available: number };
type JobRow = { id: string; url: string; platform: string; status: string; progress: number; recipe_id: string | null; created_at: string };
type EventRow = { status: string; progress: number; message: string; created_at: string };

export async function listRecipes(db: D1Database, query = '', favorite = false): Promise<Recipe[]> {
  const { results } = await db.prepare('SELECT * FROM recipes ORDER BY imported_at DESC').all<RecipeRow>();
  const needle = query.toLowerCase();
  return results.map(toRecipe).filter((recipe) => {
    const searchable = `${recipe.title} ${recipe.creator} ${recipe.cuisine} ${recipe.tags.join(' ')} ${recipe.ingredients.map((i) => i.name).join(' ')}`.toLowerCase();
    return (!needle || searchable.includes(needle)) && (!favorite || recipe.favorite);
  });
}

export async function getRecipe(db: D1Database, id: string): Promise<Recipe | null> {
  const row = await db.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first<RecipeRow>();
  return row ? toRecipe(row) : null;
}

export async function saveRecipe(db: D1Database, recipe: Recipe) {
  await db.prepare(`INSERT OR REPLACE INTO recipes
    (id,title,description,creator,platform,source_url,image,prep_time,cook_time,servings,cuisine,difficulty,tags_json,ingredients_json,instructions_json,nutrition_json,favorite,confidence,warnings_json,imported_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      recipe.id, recipe.title, recipe.description, recipe.creator, recipe.platform, recipe.sourceUrl, recipe.image,
      recipe.prepTime, recipe.cookTime, recipe.servings, recipe.cuisine, recipe.difficulty, JSON.stringify(recipe.tags),
      JSON.stringify(recipe.ingredients), JSON.stringify(recipe.instructions), JSON.stringify(recipe.nutrition),
      recipe.favorite ? 1 : 0, recipe.confidence, JSON.stringify(recipe.warnings), recipe.importedAt,
    ).run();
}

export async function deleteRecipe(db: D1Database, id: string) {
  return db.prepare('DELETE FROM recipes WHERE id = ?').bind(id).run();
}

export async function listPantry(db: D1Database, onlyAvailable = true): Promise<PantryItem[]> {
  const sql = onlyAvailable ? 'SELECT * FROM pantry_items WHERE available = 1 ORDER BY created_at DESC' : 'SELECT * FROM pantry_items ORDER BY created_at DESC';
  const { results } = await db.prepare(sql).all<PantryRow>();
  return results.map((row) => ({ id: row.id, name: row.name, quantity: row.quantity ?? undefined, unit: row.unit ?? undefined, expiry: row.expiry ?? undefined, available: Boolean(row.available) }));
}

export async function getPantryItem(db: D1Database, id: string): Promise<PantryItem | null> {
  const row = await db.prepare('SELECT * FROM pantry_items WHERE id = ?').bind(id).first<PantryRow>();
  return row ? { id: row.id, name: row.name, quantity: row.quantity ?? undefined, unit: row.unit ?? undefined, expiry: row.expiry ?? undefined, available: Boolean(row.available) } : null;
}

export async function savePantryItem(db: D1Database, item: PantryItem) {
  await db.prepare(`INSERT OR REPLACE INTO pantry_items (id,name,quantity,unit,expiry,available,created_at)
    VALUES (?,?,?,?,?,?,COALESCE((SELECT created_at FROM pantry_items WHERE id = ?),?))`).bind(
      item.id, item.name, item.quantity ?? null, item.unit ?? null, item.expiry ?? null, item.available ? 1 : 0,
      item.id, new Date().toISOString(),
    ).run();
}

export async function deletePantryItem(db: D1Database, id: string) {
  return db.prepare('DELETE FROM pantry_items WHERE id = ?').bind(id).run();
}

export async function createImportJob(db: D1Database, job: ImportJob) {
  const first = job.events[0];
  await db.batch([
    db.prepare('INSERT INTO import_jobs (id,url,platform,status,progress,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(job.id, job.url, job.platform, job.status, job.progress, job.createdAt, job.createdAt),
    db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)').bind(job.id, first.status, first.progress, first.message, first.at),
  ]);
}

export async function getImportJob(db: D1Database, id: string): Promise<ImportJob | null> {
  const row = await db.prepare('SELECT * FROM import_jobs WHERE id = ?').bind(id).first<JobRow>();
  if (!row) return null;
  const { results } = await db.prepare('SELECT status,progress,message,created_at FROM import_events WHERE job_id = ? ORDER BY id').bind(id).all<EventRow>();
  return { id: row.id, url: row.url, platform: row.platform, status: row.status, progress: row.progress, recipeId: row.recipe_id ?? undefined, createdAt: row.created_at, events: results.map((event) => ({ status: event.status, progress: event.progress, message: event.message, at: event.created_at })) };
}

export async function transitionImportJob(db: D1Database, job: ImportJob, status: string, progress: number, message: string, recipeId?: string) {
  const at = new Date().toISOString();
  await db.batch([
    db.prepare('UPDATE import_jobs SET status = ?, progress = ?, recipe_id = COALESCE(?,recipe_id), updated_at = ? WHERE id = ?').bind(status, progress, recipeId ?? null, at, job.id),
    db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)').bind(job.id, status, progress, message, at),
  ]);
  job.status = status; job.progress = progress; job.recipeId = recipeId ?? job.recipeId;
  job.events.push({ status, progress, message, at });
}

export function normalizeIngredient(name: string) {
  const aliases: Record<string, string> = { curd: 'yogurt', 'greek yogurt': 'yogurt', 'bell pepper': 'capsicum', 'bell peppers': 'capsicum', 'coriander leaves': 'cilantro', coriander: 'cilantro', scallion: 'spring onion', scallions: 'spring onion' };
  return aliases[name.trim().toLowerCase()] ?? name.trim().toLowerCase();
}

export function buildRecommendations(recipes: Recipe[], pantry: PantryItem[]) {
  const owned = new Set(pantry.filter((item) => item.available).map((item) => normalizeIngredient(item.name)));
  return recipes.map((recipe) => {
    const required = recipe.ingredients.filter((item) => !item.optional);
    const missing = required.filter((item) => !owned.has(normalizeIngredient(item.name))).map((item) => item.name);
    const match = Math.round(((required.length - missing.length) / Math.max(required.length, 1)) * 100);
    return { recipe, match, missing, category: match === 100 ? 'can_make_now' : missing.length <= 2 ? 'almost_ready' : match >= 50 ? 'best_matches' : 'need_shopping' };
  }).sort((a, b) => b.match - a.match);
}

function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id, title: row.title, description: row.description, creator: row.creator, platform: row.platform,
    sourceUrl: row.source_url, image: row.image, prepTime: row.prep_time, cookTime: row.cook_time,
    servings: row.servings, cuisine: row.cuisine, difficulty: row.difficulty, tags: parse(row.tags_json, []),
    ingredients: parse(row.ingredients_json, []), instructions: parse(row.instructions_json, []),
    nutrition: parse(row.nutrition_json, { calories: 0, protein: 0, carbs: 0, fat: 0, estimated: true }),
    favorite: Boolean(row.favorite), confidence: row.confidence, warnings: parse(row.warnings_json, []), importedAt: row.imported_at,
  };
}

function parse<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}
