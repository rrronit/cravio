import app from './index';

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

console.log('Hono API smoke tests passed');

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
