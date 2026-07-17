import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { isAppError } from './models/error.model';
import type { AppEnv } from './models/app.model';
import { logApiError } from './lib/logger';
import { importRoutes } from './routes/import.routes';
import { ingredientRoutes } from './routes/ingredient.routes';
import { pantryRoutes } from './routes/pantry.routes';
import { recipeRoutes } from './routes/recipe.routes';
import { recommendationRoutes } from './routes/recommendation.routes';
import { systemRoutes } from './routes/system.routes';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes/auth.routes';
import { requireAuth } from './middleware/auth.middleware';

export const app = new Hono<AppEnv>();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('*', requireAuth);

app.route('/', systemRoutes);
app.route('/auth', authRoutes);
app.route('/imports', importRoutes);
app.route('/recipes', recipeRoutes);
app.route('/ingredients', ingredientRoutes);
app.route('/pantry', pantryRoutes);
app.route('/recommendations', recommendationRoutes);
app.route('/users', userRoutes);

app.notFound((c) => c.json({ error: 'Route not found.' }, 404));

app.onError((error, c) => {
  if (isAppError(error)) {
    return c.json({ error: error.message, details: error.details }, error.status);
  }
  logApiError(error);
  return c.json({ error: 'The request could not be processed.' }, 500);
});
