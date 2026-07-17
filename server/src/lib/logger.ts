import type { ImportJob } from '../models/import.model';

export function logImport(job: ImportJob, message: string) {
  console.info(JSON.stringify({
    event: 'recipe_import',
    jobId: job.id,
    platform: job.platform,
    status: job.status,
    progress: job.progress,
    message,
    timestamp: new Date().toISOString(),
  }));
}

export function logImportRejection(message: string) {
  console.warn(JSON.stringify({ event: 'recipe_import_rejected', status: 'failed', message, timestamp: new Date().toISOString() }));
}

export function logApiError(error: Error) {
  console.error(JSON.stringify({ event: 'api_error', message: error.message, timestamp: new Date().toISOString() }));
}
