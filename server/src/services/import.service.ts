import { createAppError } from '../models/error.model';
import type { ImportCreate, ImportJob, ImportStatus } from '../models/import.model';
import type { ImportRepository } from '../repositories/import.repository';
import type { RecipeRepository } from '../repositories/recipe.repository';
import { logImport } from '../lib/logger';
import type { SourceExtractor } from './source-extractor.service';
import type { RecipeGenerator } from './recipe-generator.service';

export const createImportService = (imports: ImportRepository, recipes: RecipeRepository, sources: SourceExtractor, generator: RecipeGenerator) => ({
  create: createImport.bind(null, imports, sources),
  get: getImport.bind(null, imports),
  advance: advanceImport.bind(null, imports, recipes, sources, generator),
  getAndAdvance: advanceImport.bind(null, imports, recipes, sources, generator),
});

export async function createImport(imports: ImportRepository, sources: SourceExtractor, input: ImportCreate, userId: string): Promise<ImportJob> {
  const createdAt = new Date().toISOString();
  const normalized = sources.normalize(input.url);
  const job: ImportJob = {
    id: `imp_${crypto.randomUUID()}`, userId, url: normalized.url, platform: normalized.platform,
    status: 'queued', progress: 0, createdAt,
    caption: input.caption?.trim() || undefined,
    events: [{ status: 'queued', progress: 0, at: createdAt, message: 'Import accepted and queued.' }],
  };
  await imports.create(job);
  logImport(job, 'Import accepted and queued.');
  return job;
}

export async function getImport(imports: ImportRepository, id: string, userId: string): Promise<ImportJob> {
  const job = await imports.findById(id, userId);
  if (!job) throw createAppError(404, 'Import job not found.');
  return job;
}

export async function advanceImport(
  imports: ImportRepository,
  recipes: RecipeRepository,
  sources: SourceExtractor,
  generator: RecipeGenerator,
  id: string,
  userId: string,
): Promise<ImportJob> {
  const job = await getImport(imports, id, userId);
  if (job.status === 'queued') {
    await transitionImport(imports, job, 'extracting', 35, `Extracting metadata from ${job.platform}.`);
  } else if (job.status === 'extracting' || job.status === 'generating_recipe') {
    if (job.status === 'extracting') {
      await transitionImport(imports, job, 'generating_recipe', 72, 'Generating ingredients, instructions, nutrition, and tags.');
    }
    try {
      const extraction = job.extraction ?? await sources.extract(job.url, job.caption);
      if (!job.extraction) {
        await imports.saveExtraction(job.id, extraction);
        job.extraction = extraction;
      }
      const imported = await generator.generate(job, extraction);
      await recipes.save(imported);
      await transitionImport(imports, job, 'ready', 100, `Real recipe extracted via ${extraction.provider} and saved as ${imported.id}.`, imported.id);
    } catch (error) {
      const message = safeFailureMessage(error);
      await imports.fail(job, message);
      logImport(job, message);
    }
  }
  return job;
}

async function transitionImport(
  imports: ImportRepository,
  job: ImportJob,
  status: ImportStatus,
  progress: number,
  message: string,
  recipeId?: string,
): Promise<void> {
  await imports.transition(job, status, progress, message, recipeId);
  logImport(job, message);
}

function safeFailureMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'The reel could not be extracted.';
  return message.length <= 240 ? message : 'The reel could not be extracted.';
}
