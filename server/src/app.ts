import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { isAppError } from './models/error.model';
import type { AppEnv } from './models/app.model';
import { logApiError } from './lib/logger';
import { logApiStep } from './lib/auth';
import { importRoutes } from './routes/import.routes';
import { ingredientRoutes } from './routes/ingredient.routes';
import { pantryRoutes } from './routes/pantry.routes';
import { recipeRoutes } from './routes/recipe.routes';
import { recommendationRoutes } from './routes/recommendation.routes';
import { systemRoutes } from './routes/system.routes';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes/auth.routes';
import { preferenceRoutes } from './routes/preference.routes';
import { notificationRoutes } from './routes/notification.routes';
import { shoppingListRoutes } from './routes/shopping-list.routes';
import { requireAuth } from './middleware/auth.middleware';
import { requestLogger } from './middleware/request-logger.middleware';

export const app = new Hono<AppEnv>();

app.use('*', requestLogger);

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Request-Id'],
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
app.route('/preferences', preferenceRoutes);
app.route('/notifications', notificationRoutes);
app.route('/shopping-list', shoppingListRoutes);

app.notFound((c) => {
  logApiStep(c, 'route.not_found', { status: 404 });
  return c.json({ error: 'Route not found.' }, 404);
});

app.onError((error, c) => {
  if (isAppError(error)) {
    logApiStep(c, 'request.failed', { status: error.status, errorType: 'app_error' });
    return c.json({ error: error.message, details: error.details }, error.status);
  }
  logApiStep(c, 'request.failed', { status: 500, errorType: 'unexpected_error' });
  logApiError(error, { requestId: c.get('requestId'), method: c.req.method, path: c.req.path, status: 500 });
  return c.json({ error: 'The request could not be processed.' }, 500);
});
