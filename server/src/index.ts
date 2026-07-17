import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import {
  buildRecommendations, createImportJob, deletePantryItem, deleteRecipe, getImportJob, getPantryItem, getRecipe,
  ImportJob, listPantry, listRecipes, normalizeIngredient, savePantryItem, saveRecipe, transitionImportJob,
} from './db';

type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'], allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));

app.get('/', (c) => c.json({ service: 'cravio-api', runtime: 'cloudflare-workers', framework: 'hono', database: 'd1' }));
app.get('/health', async (c) => {
  const check = await c.env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
  return c.json({ ok: check?.ok === 1, service: 'cravio-api', database: 'd1', timestamp: new Date().toISOString() });
});

app.post('/imports', async (c) => {
  const input = z.object({ url: z.string().url(), caption: z.string().optional() }).safeParse(await readJson(c.req.raw));
  if (!input.success) {
    console.warn(JSON.stringify({ event: 'recipe_import_rejected', status: 'failed', message: 'A valid recipe video URL is required.', timestamp: new Date().toISOString() }));
    return c.json({ error: 'A valid recipe video URL is required.', details: input.error.flatten() }, 400);
  }

  const platform = detectPlatform(input.data.url);
  const createdAt = new Date().toISOString();
  const job: ImportJob = {
    id: `imp_${crypto.randomUUID()}`, url: input.data.url, platform, status: 'queued', progress: 0, createdAt,
    events: [{ status: 'queued', progress: 0, at: createdAt, message: 'Import accepted and queued.' }],
  };
  await createImportJob(c.env.DB, job);
  logImport(job, 'Import accepted and queued.');
  return c.json(job, 202);
});

app.get('/imports/:id', async (c) => {
  const job = await getImportJob(c.env.DB, c.req.param('id'));
  if (!job) return c.json({ error: 'Import job not found.' }, 404);

  const age = Date.now() - Date.parse(job.createdAt);
  if (job.status === 'queued' && age > 300) {
    await transition(c.env.DB, job, 'extracting', 35, `Extracting metadata from ${job.platform}.`);
  } else if (job.status === 'extracting' && age > 1200) {
    await transition(c.env.DB, job, 'generating_recipe', 72, 'Generating ingredients, instructions, nutrition, and tags.');
  } else if (job.status === 'generating_recipe' && age > 2500) {
    const base = await getRecipe(c.env.DB, '3');
    if (!base) return c.json({ error: 'Recipe seed is unavailable. Apply D1 migrations.' }, 503);
    const imported = {
      ...base, id: crypto.randomUUID(), title: 'Imported Recipe', sourceUrl: job.url, platform: job.platform,
      favorite: false, confidence: 0.72, warnings: ['This demo extraction should be reviewed before cooking.'], importedAt: new Date().toISOString(),
    };
    await saveRecipe(c.env.DB, imported);
    await transition(c.env.DB, job, 'ready', 100, `Recipe generated and saved as ${imported.id}.`, imported.id);
  }
  return c.json(job);
});

app.get('/recipes', async (c) => {
  const data = await listRecipes(c.env.DB, c.req.query('q') ?? '', c.req.query('favorite') === 'true');
  return c.json({ data, total: data.length });
});

app.get('/recipes/:id', async (c) => {
  const recipe = await getRecipe(c.env.DB, c.req.param('id'));
  return recipe ? c.json(recipe) : c.json({ error: 'Recipe not found.' }, 404);
});

app.put('/recipes/:id', async (c) => {
  const recipe = await getRecipe(c.env.DB, c.req.param('id'));
  if (!recipe) return c.json({ error: 'Recipe not found.' }, 404);
  const ingredient = z.object({ name: z.string().min(1), quantity: z.string().min(1), optional: z.boolean().optional() });
  const updates = z.object({
    title: z.string().min(1), description: z.string(), creator: z.string(), sourceUrl: z.string().url(),
    prepTime: z.number().nonnegative(), cookTime: z.number().nonnegative(), servings: z.number().int().positive(),
    cuisine: z.string(), difficulty: z.string(), tags: z.array(z.string()), ingredients: z.array(ingredient).min(1),
    instructions: z.array(z.string().min(1)).min(1), favorite: z.boolean(), warnings: z.array(z.string()),
  }).partial().safeParse(await readJson(c.req.raw));
  if (!updates.success) return c.json({ error: 'Invalid recipe update.', details: updates.error.flatten() }, 400);
  const updated = { ...recipe, ...updates.data };
  await saveRecipe(c.env.DB, updated);
  return c.json(updated);
});

app.delete('/recipes/:id', async (c) => {
  if (!await getRecipe(c.env.DB, c.req.param('id'))) return c.json({ error: 'Recipe not found.' }, 404);
  await deleteRecipe(c.env.DB, c.req.param('id'));
  return c.body(null, 204);
});

app.get('/ingredients', async (c) => {
  const recipes = await listRecipes(c.env.DB);
  const counts = new Map<string, { name: string; recipeIds: string[] }>();
  recipes.forEach((recipe) => recipe.ingredients.forEach((ingredient) => {
    const canonical = normalizeIngredient(ingredient.name);
    const current = counts.get(canonical) ?? { name: canonical.replace(/\b\w/g, (letter) => letter.toUpperCase()), recipeIds: [] };
    if (!current.recipeIds.includes(recipe.id)) current.recipeIds.push(recipe.id);
    counts.set(canonical, current);
  }));
  const data = [...counts.values()].map((item) => ({ ...item, recipeCount: item.recipeIds.length })).sort((a, b) => b.recipeCount - a.recipeCount);
  return c.json({ data });
});

app.get('/pantry', async (c) => {
  const data = await listPantry(c.env.DB);
  return c.json({ data, total: data.length });
});

app.post('/pantry', async (c) => {
  const input = z.object({ name: z.string().min(1), quantity: z.number().positive().optional(), unit: z.string().optional(), expiry: z.string().optional() }).safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'Invalid pantry item.', details: input.error.flatten() }, 400);
  const item = { id: `pan_${crypto.randomUUID()}`, available: true, ...input.data };
  await savePantryItem(c.env.DB, item);
  return c.json(item, 201);
});

app.put('/pantry/:id', async (c) => {
  const item = await getPantryItem(c.env.DB, c.req.param('id'));
  if (!item) return c.json({ error: 'Pantry item not found.' }, 404);
  const updates = z.object({ name: z.string().min(1), quantity: z.number().positive(), unit: z.string().min(1), expiry: z.string(), available: z.boolean() }).partial().safeParse(await readJson(c.req.raw));
  if (!updates.success) return c.json({ error: 'Invalid pantry update.', details: updates.error.flatten() }, 400);
  const updated = { ...item, ...updates.data };
  await savePantryItem(c.env.DB, updated);
  return c.json(updated);
});

app.delete('/pantry/:id', async (c) => {
  if (!await getPantryItem(c.env.DB, c.req.param('id'))) return c.json({ error: 'Pantry item not found.' }, 404);
  await deletePantryItem(c.env.DB, c.req.param('id'));
  return c.body(null, 204);
});

app.get('/recommendations', async (c) => {
  const parsed = z.enum(['can_make_now', 'almost_ready', 'best_matches', 'need_shopping']).optional().safeParse(c.req.query('category'));
  if (!parsed.success) return c.json({ error: 'Unknown recommendation category.' }, 400);
  const recommendations = buildRecommendations(await listRecipes(c.env.DB), await listPantry(c.env.DB));
  const data = recommendations.filter((item) => !parsed.data || item.category === parsed.data);
  return c.json({ data, total: data.length });
});

app.notFound((c) => c.json({ error: 'Route not found.' }, 404));
app.onError((error, c) => {
  console.error(JSON.stringify({ event: 'api_error', message: error.message, timestamp: new Date().toISOString() }));
  return c.json({ error: 'The request could not be processed.' }, 500);
});

async function transition(db: D1Database, job: ImportJob, status: string, progress: number, message: string, recipeId?: string) {
  await transitionImportJob(db, job, status, progress, message, recipeId);
  logImport(job, message);
}

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return undefined; }
}

function detectPlatform(url: string) {
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  return 'Unknown';
}

function logImport(job: ImportJob, message: string) {
  console.info(JSON.stringify({ event: 'recipe_import', jobId: job.id, platform: job.platform, status: job.status, progress: job.progress, message, timestamp: new Date().toISOString() }));
}

export default app;
