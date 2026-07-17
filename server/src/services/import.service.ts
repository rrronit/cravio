import { AppError } from '../models/error.model';
import type { ImportCreate, ImportJob, ImportStatus } from '../models/import.model';
import type { ImportRepository } from '../repositories/import.repository';
import type { RecipeRepository } from '../repositories/recipe.repository';
import { logImport } from '../lib/logger';

export class ImportService {
  constructor(
    private readonly imports: ImportRepository,
    private readonly recipes: RecipeRepository,
  ) {}

  async create(input: ImportCreate, userId: string): Promise<ImportJob> {
    const createdAt = new Date().toISOString();
    const job: ImportJob = {
      id: `imp_${crypto.randomUUID()}`,
      userId,
      url: input.url,
      platform: detectPlatform(input.url),
      status: 'queued',
      progress: 0,
      createdAt,
      events: [{ status: 'queued', progress: 0, at: createdAt, message: 'Import accepted and queued.' }],
    };
    await this.imports.create(job);
    logImport(job, 'Import accepted and queued.');
    return job;
  }

  async getAndAdvance(id: string, userId: string): Promise<ImportJob> {
    const job = await this.imports.findById(id, userId);
    if (!job) throw new AppError(404, 'Import job not found.');

    const age = Date.now() - Date.parse(job.createdAt);
    if (job.status === 'queued' && age > 300) {
      await this.transition(job, 'extracting', 35, `Extracting metadata from ${job.platform}.`);
    } else if (job.status === 'extracting' && age > 1200) {
      await this.transition(job, 'generating_recipe', 72, 'Generating ingredients, instructions, nutrition, and tags.');
    } else if (job.status === 'generating_recipe' && age > 2500) {
      const base = await this.recipes.findTemplate();
      if (!base) throw new AppError(503, 'Recipe seed is unavailable. Apply D1 migrations.');
      const imported = {
        ...base,
        id: crypto.randomUUID(),
        userId: job.userId,
        title: 'Imported Recipe',
        sourceUrl: job.url,
        platform: job.platform,
        favorite: false,
        confidence: 0.72,
        warnings: ['This demo extraction should be reviewed before cooking.'],
        importedAt: new Date().toISOString(),
      };
      await this.recipes.save(imported);
      await this.transition(job, 'ready', 100, `Recipe generated and saved as ${imported.id}.`, imported.id);
    }
    return job;
  }

  private async transition(job: ImportJob, status: ImportStatus, progress: number, message: string, recipeId?: string) {
    await this.imports.transition(job, status, progress, message, recipeId);
    logImport(job, message);
  }
}

function detectPlatform(url: string) {
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  return 'Unknown';
}
