import { Hono } from 'hono';
import { listRecommendations } from '../handlers/recommendation.handler';
import type { AppEnv } from '../models/app.model';

export const recommendationRoutes = new Hono<AppEnv>().get('/', listRecommendations);
