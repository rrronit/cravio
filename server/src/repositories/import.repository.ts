import type { ImportEventRow, ImportJob, ImportJobRow, ImportStatus } from '../models/import.model';

export class ImportRepository {
  constructor(private readonly db: D1Database) {}

  async create(job: ImportJob): Promise<void> {
    const firstEvent = job.events[0];
    await this.db.batch([
      this.db.prepare('INSERT INTO import_jobs (id,user_id,url,platform,status,progress,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
        .bind(job.id, job.userId, job.url, job.platform, job.status, job.progress, job.createdAt, job.createdAt),
      this.db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)')
        .bind(job.id, firstEvent.status, firstEvent.progress, firstEvent.message, firstEvent.at),
    ]);
  }

  async findById(id: string, userId: string): Promise<ImportJob | null> {
    const row = await this.db.prepare('SELECT * FROM import_jobs WHERE id = ? AND user_id = ?').bind(id, userId).first<ImportJobRow>();
    if (!row) return null;
    const { results } = await this.db.prepare(
      'SELECT status,progress,message,created_at FROM import_events WHERE job_id = ? ORDER BY id',
    ).bind(id).all<ImportEventRow>();
    return {
      id: row.id,
      userId: row.user_id,
      url: row.url,
      platform: row.platform,
      status: row.status,
      progress: row.progress,
      recipeId: row.recipe_id ?? undefined,
      createdAt: row.created_at,
      events: results.map((event) => ({
        status: event.status,
        progress: event.progress,
        message: event.message,
        at: event.created_at,
      })),
    };
  }

  async transition(job: ImportJob, status: ImportStatus, progress: number, message: string, recipeId?: string): Promise<void> {
    const at = new Date().toISOString();
    await this.db.batch([
      this.db.prepare('UPDATE import_jobs SET status = ?, progress = ?, recipe_id = COALESCE(?,recipe_id), updated_at = ? WHERE id = ?')
        .bind(status, progress, recipeId ?? null, at, job.id),
      this.db.prepare('INSERT INTO import_events (job_id,status,progress,message,created_at) VALUES (?,?,?,?,?)')
        .bind(job.id, status, progress, message, at),
    ]);
    job.status = status;
    job.progress = progress;
    job.recipeId = recipeId ?? job.recipeId;
    job.events.push({ status, progress, message, at });
  }
}
