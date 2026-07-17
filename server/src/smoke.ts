import app from './index';
import { importJobs } from './data/store';

const health = await app.request('/health');
assert(health.status === 200, 'health should return 200');
assert(((await health.json()) as { ok: boolean }).ok === true, 'health should be ok');

const recipes = await app.request('/recipes?q=miso');
assert(recipes.status === 200, 'recipe search should return 200');
assert(((await recipes.json()) as { total: number }).total === 1, 'recipe search should find miso noodles');

const recommendations = await app.request('/recommendations?category=can_make_now');
assert(recommendations.status === 200, 'recommendations should return 200');

const invalidUpdate = await app.request('/recipes/1', {
  method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ingredients: null }),
});
assert(invalidUpdate.status === 400, 'invalid recipe update should return 400');

const created = await app.request('/pantry', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Capsicum', quantity: 2, unit: 'items' }),
});
assert(created.status === 201, 'pantry create should return 201');

const importResponse = await app.request('/imports', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://instagram.com/reel/smoke' }),
});
assert(importResponse.status === 202, 'import should be queued');
const importJob = (await importResponse.json()) as { id: string };
const storedJob = importJobs.find((job) => job.id === importJob.id);
assert(Boolean(storedJob), 'import job should be stored');
storedJob!.createdAt = new Date(Date.now() - 5000).toISOString();
await app.request(`/imports/${importJob.id}`);
await app.request(`/imports/${importJob.id}`);
const readyResponse = await app.request(`/imports/${importJob.id}`);
const readyJob = (await readyResponse.json()) as { status: string; events: unknown[] };
assert(readyJob.status === 'ready', 'import should advance to ready');
assert(readyJob.events.length === 4, 'import should record every processing step');

console.log('Hono API smoke tests passed');

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
