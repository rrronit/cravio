import type { ImportEventRow, ImportJob, ImportJobRow, ImportStatus } from '../models/import.model';

export const createImportRepository = (db: D1Database) => ({
  create: async (job: ImportJob): Promise<void> => {
    const firstEvent = job.events[0];
    await db.batch([
      db.prepare('INSERT INTO import_jobs (id,user_id,url,platform,status,progress,caption,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .bind(job.id, job.userId, job.url, job.platform, job.status, job.progress, job.caption ?? null, job.createdAt, job.createdAt),
      db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)')
        .bind(job.id, firstEvent.status, firstEvent.progress, firstEvent.message, firstEvent.at),
    ]);
  },
  findById: async (id: string, userId: string): Promise<ImportJob | null> => {
    const row = await db.prepare('SELECT * FROM import_jobs WHERE id = ? AND user_id = ?').bind(id, userId).first<ImportJobRow>();
    if (!row) return null;
    const { results } = await db.prepare('SELECT status,progress,message,created_at FROM import_events WHERE job_id = ? ORDER BY id').bind(id).all<ImportEventRow>();
    return {
      id: row.id, userId: row.user_id, url: row.url, platform: row.platform, status: row.status,
      progress: row.progress, recipeId: row.recipe_id ?? undefined, createdAt: row.created_at,
      caption: row.caption ?? undefined,
      extraction: parseJson(row.extraction_json),
      errorMessage: row.error_message ?? undefined,
      events: results.map((event) => ({ status: event.status, progress: event.progress, message: event.message, at: event.created_at })),
    };
  },
  transition: async (job: ImportJob, status: ImportStatus, progress: number, message: string, recipeId?: string): Promise<void> => {
    const at = new Date().toISOString();
    await db.batch([
      db.prepare('UPDATE import_jobs SET status = ?, progress = ?, recipe_id = COALESCE(?,recipe_id), updated_at = ? WHERE id = ?').bind(status, progress, recipeId ?? null, at, job.id),
      db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)').bind(job.id, status, progress, message, at),
    ]);
    job.status = status; job.progress = progress; job.recipeId = recipeId ?? job.recipeId;
    job.events.push({ status, progress, message, at });
  },
  saveExtraction: async (jobId: string, extraction: ImportJob['extraction']): Promise<void> => {
    await db.prepare('UPDATE import_jobs SET extraction_json = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(extraction), new Date().toISOString(), jobId).run();
  },
  fail: async (job: ImportJob, message: string): Promise<void> => {
    const at = new Date().toISOString();
    await db.batch([
      db.prepare('UPDATE import_jobs SET status = ?, progress = ?, error_message = ?, updated_at = ? WHERE id = ?')
        .bind('failed', job.progress, message, at, job.id),
      db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)')
        .bind(job.id, 'failed', job.progress, message, at),
    ]);
    job.status = 'failed'; job.errorMessage = message;
    job.events.push({ status: 'failed', progress: job.progress, message, at });
  },
});

export type ImportRepository = ReturnType<typeof createImportRepository>;

const parseJson = (value: string | null): ImportJob['extraction'] => {
  if (!value) return undefined;
  try { return JSON.parse(value) as ImportJob['extraction']; } catch { return undefined; }
};
