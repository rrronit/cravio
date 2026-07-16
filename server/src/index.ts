import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { importJobs, normalizeIngredient, pantry, recipes, recommendations } from './data/store.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true, service: 'cravio-api', timestamp: new Date().toISOString() }));

app.post('/imports', (req, res) => {
  const input = z.object({ url: z.string().url(), caption: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'A valid recipe video URL is required.', details: input.error.flatten() });
  let platform = 'Unknown';
  if (input.data.url.includes('instagram.com')) platform = 'Instagram';
  else if (input.data.url.includes('tiktok.com')) platform = 'TikTok';
  else if (input.data.url.includes('youtube.com') || input.data.url.includes('youtu.be')) platform = 'YouTube';
  const job = { id: `imp_${Date.now()}`, url: input.data.url, platform, status: 'queued', progress: 0, createdAt: new Date().toISOString() };
  importJobs.unshift(job);
  res.status(202).json(job);
});

app.get('/imports/:id', (req, res) => {
  const job = importJobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Import job not found.' });
  res.json(job);
});

app.get('/recipes', (req, res) => {
  const query = String(req.query.q ?? '').toLowerCase();
  const favorite = req.query.favorite === 'true';
  const result = recipes.filter((recipe) => {
    const searchable = `${recipe.title} ${recipe.creator} ${recipe.cuisine} ${recipe.tags.join(' ')} ${recipe.ingredients.map(i => i.name).join(' ')}`.toLowerCase();
    return (!query || searchable.includes(query)) && (!favorite || recipe.favorite);
  });
  res.json({ data: result, total: result.length });
});

app.get('/recipes/:id', (req, res) => {
  const recipe = recipes.find((item) => item.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found.' });
  res.json(recipe);
});

app.put('/recipes/:id', (req, res) => {
  const index = recipes.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Recipe not found.' });
  const protectedFields = ['id', 'importedAt'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => !protectedFields.includes(key)));
  recipes[index] = { ...recipes[index], ...updates };
  res.json(recipes[index]);
});

app.delete('/recipes/:id', (req, res) => {
  const index = recipes.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Recipe not found.' });
  recipes.splice(index, 1);
  res.status(204).send();
});

app.get('/ingredients', (_req, res) => {
  const counts = new Map<string, { name: string; recipeIds: string[] }>();
  recipes.forEach((recipe) => recipe.ingredients.forEach((ingredient) => {
    const canonical = normalizeIngredient(ingredient.name);
    const current = counts.get(canonical) ?? { name: canonical.replace(/\b\w/g, c => c.toUpperCase()), recipeIds: [] };
    if (!current.recipeIds.includes(recipe.id)) current.recipeIds.push(recipe.id);
    counts.set(canonical, current);
  }));
  res.json({ data: [...counts.values()].map(item => ({ ...item, recipeCount: item.recipeIds.length })).sort((a, b) => b.recipeCount - a.recipeCount) });
});

app.get('/pantry', (_req, res) => res.json({ data: pantry.filter((item) => item.available), total: pantry.filter((item) => item.available).length }));

app.post('/pantry', (req, res) => {
  const input = z.object({ name: z.string().min(1), quantity: z.number().positive().optional(), unit: z.string().optional(), expiry: z.string().optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Invalid pantry item.', details: input.error.flatten() });
  const item = { id: `pan_${Date.now()}`, available: true, ...input.data };
  pantry.unshift(item);
  res.status(201).json(item);
});

app.put('/pantry/:id', (req, res) => {
  const index = pantry.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Pantry item not found.' });
  pantry[index] = { ...pantry[index], ...req.body, id: pantry[index].id };
  res.json(pantry[index]);
});

app.delete('/pantry/:id', (req, res) => {
  const index = pantry.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Pantry item not found.' });
  pantry.splice(index, 1);
  res.status(204).send();
});

app.get('/recommendations', (req, res) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const data = recommendations().filter((item) => !category || item.category === category);
  res.json({ data, total: data.length });
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

app.listen(port, () => console.log(`Cravio API listening on http://localhost:${port}`));
