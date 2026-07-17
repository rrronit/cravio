import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from './models/error.model';
import type { AppEnv } from './models/app.model';
import { logApiError } from './lib/logger';
import { importRoutes } from './routes/import.routes';
import { ingredientRoutes } from './routes/ingredient.routes';
import { pantryRoutes } from './routes/pantry.routes';
import { recipeRoutes } from './routes/recipe.routes';
import { recommendationRoutes } from './routes/recommendation.routes';
import { systemRoutes } from './routes/system.routes';
import { userRoutes } from './routes/user.routes';

export const app = new Hono<AppEnv>();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.route('/', systemRoutes);
app.route('/imports', importRoutes);
app.route('/recipes', recipeRoutes);
app.route('/ingredients', ingredientRoutes);
app.route('/pantry', pantryRoutes);
app.route('/recommendations', recommendationRoutes);
app.route('/users', userRoutes);

app.notFound((c) => c.json({ error: 'Route not found.' }, 404));

app.onError((error, c) => {
  if (error instanceof AppError) {
    return c.json({ error: error.message, details: error.details }, error.status);
  }
  logApiError(error);
  return c.json({ error: 'The request could not be processed.' }, 500);
});
