import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { importJobs, normalizeIngredient, pantry, recipes, recommendations } from './data/store';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.get('/', (c) => c.json({ service: 'cravio-api', runtime: 'cloudflare-workers', framework: 'hono' }));
app.get('/health', (c) => c.json({ ok: true, service: 'cravio-api', timestamp: new Date().toISOString() }));

app.post('/imports', async (c) => {
  const body = await readJson(c.req.raw);
  const input = z.object({ url: z.string().url(), caption: z.string().optional() }).safeParse(body);
  if (!input.success) return c.json({ error: 'A valid recipe video URL is required.', details: input.error.flatten() }, 400);

  let platform = 'Unknown';
  if (input.data.url.includes('instagram.com')) platform = 'Instagram';
  else if (input.data.url.includes('tiktok.com')) platform = 'TikTok';
  else if (input.data.url.includes('youtube.com') || input.data.url.includes('youtu.be')) platform = 'YouTube';

  const job = {
    id: `imp_${crypto.randomUUID()}`, url: input.data.url, platform, status: 'queued', progress: 0,
    createdAt: new Date().toISOString(),
  };
  importJobs.unshift(job);
  return c.json(job, 202);
});

app.get('/imports/:id', (c) => {
  const job = importJobs.find((item) => item.id === c.req.param('id'));
  if (!job) return c.json({ error: 'Import job not found.' }, 404);

  const age = Date.now() - Date.parse(job.createdAt);
  if (age > 2500 && job.status !== 'ready') {
    const imported = {
      ...recipes[2], id: crypto.randomUUID(), title: 'Imported Recipe', sourceUrl: job.url, platform: job.platform,
      favorite: false, confidence: 0.72, warnings: ['This demo extraction should be reviewed before cooking.'], importedAt: new Date().toISOString(),
    };
    recipes.unshift(imported);
    job.status = 'ready'; job.progress = 100; job.recipeId = imported.id;
  } else if (age > 1200) {
    job.status = 'generating_recipe'; job.progress = 72;
  } else if (age > 300) {
    job.status = 'extracting'; job.progress = 35;
  }
  return c.json(job);
});

app.get('/recipes', (c) => {
  const query = (c.req.query('q') ?? '').toLowerCase();
  const favorite = c.req.query('favorite') === 'true';
  const data = recipes.filter((recipe) => {
    const searchable = `${recipe.title} ${recipe.creator} ${recipe.cuisine} ${recipe.tags.join(' ')} ${recipe.ingredients.map(i => i.name).join(' ')}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!favorite || recipe.favorite);
  });
  return c.json({ data, total: data.length });
});

app.get('/recipes/:id', (c) => {
  const recipe = recipes.find((item) => item.id === c.req.param('id'));
  return recipe ? c.json(recipe) : c.json({ error: 'Recipe not found.' }, 404);
});

app.put('/recipes/:id', async (c) => {
  const index = recipes.findIndex((item) => item.id === c.req.param('id'));
  if (index < 0) return c.json({ error: 'Recipe not found.' }, 404);

  const ingredient = z.object({ name: z.string().min(1), quantity: z.string().min(1), optional: z.boolean().optional() });
  const updates = z.object({
    title: z.string().min(1), description: z.string(), creator: z.string(), sourceUrl: z.string().url(),
    prepTime: z.number().nonnegative(), cookTime: z.number().nonnegative(), servings: z.number().int().positive(),
    cuisine: z.string(), difficulty: z.string(), tags: z.array(z.string()), ingredients: z.array(ingredient).min(1),
    instructions: z.array(z.string().min(1)).min(1), favorite: z.boolean(), warnings: z.array(z.string()),
  }).partial().safeParse(await readJson(c.req.raw));
  if (!updates.success) return c.json({ error: 'Invalid recipe update.', details: updates.error.flatten() }, 400);
  recipes[index] = { ...recipes[index], ...updates.data };
  return c.json(recipes[index]);
});

app.delete('/recipes/:id', (c) => {
  const index = recipes.findIndex((item) => item.id === c.req.param('id'));
  if (index < 0) return c.json({ error: 'Recipe not found.' }, 404);
  recipes.splice(index, 1);
  return c.body(null, 204);
});

app.get('/ingredients', (c) => {
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

app.get('/pantry', (c) => {
  const data = pantry.filter((item) => item.available);
  return c.json({ data, total: data.length });
});

app.post('/pantry', async (c) => {
  const input = z.object({ name: z.string().min(1), quantity: z.number().positive().optional(), unit: z.string().optional(), expiry: z.string().optional() }).safeParse(await readJson(c.req.raw));
  if (!input.success) return c.json({ error: 'Invalid pantry item.', details: input.error.flatten() }, 400);
  const item = { id: `pan_${crypto.randomUUID()}`, available: true, ...input.data };
  pantry.unshift(item);
  return c.json(item, 201);
});

app.put('/pantry/:id', async (c) => {
  const index = pantry.findIndex((item) => item.id === c.req.param('id'));
  if (index < 0) return c.json({ error: 'Pantry item not found.' }, 404);
  const updates = z.object({ name: z.string().min(1), quantity: z.number().positive(), unit: z.string().min(1), expiry: z.string(), available: z.boolean() }).partial().safeParse(await readJson(c.req.raw));
  if (!updates.success) return c.json({ error: 'Invalid pantry update.', details: updates.error.flatten() }, 400);
  pantry[index] = { ...pantry[index], ...updates.data, id: pantry[index].id };
  return c.json(pantry[index]);
});

app.delete('/pantry/:id', (c) => {
  const index = pantry.findIndex((item) => item.id === c.req.param('id'));
  if (index < 0) return c.json({ error: 'Pantry item not found.' }, 404);
  pantry.splice(index, 1);
  return c.body(null, 204);
});

app.get('/recommendations', (c) => {
  const parsed = z.enum(['can_make_now', 'almost_ready', 'best_matches', 'need_shopping']).optional().safeParse(c.req.query('category'));
  if (!parsed.success) return c.json({ error: 'Unknown recommendation category.' }, 400);
  const data = recommendations().filter((item) => !parsed.data || item.category === parsed.data);
  return c.json({ data, total: data.length });
});

app.notFound((c) => c.json({ error: 'Route not found.' }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'The request could not be processed.' }, 400);
});

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return undefined; }
}

export default app;
