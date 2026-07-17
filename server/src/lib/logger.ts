import type { ImportJob } from '../models/import.model';

type ApiLogValue = string | number | boolean | null | undefined;
type ApiLogFields = Record<string, ApiLogValue>;

export type ApiStepLogger = (name: string, fields?: ApiLogFields) => void;

export const createApiStepLogger = (requestId: string, method: string, path: string, cfRay?: string): ApiStepLogger => {
  let step = 0;
  return (name, fields = {}) => {
    step += 1;
    console.info(JSON.stringify({
      ...fields,
      event: 'api_step',
      requestId,
      method,
      path,
      cfRay,
      step,
      message: `Step ${step}: ${name}`,
      timestamp: new Date().toISOString(),
    }));
  };
};

export function logImport(job: ImportJob, message: string) {
  const step = Math.max(job.events.length, 1);
  console.info(JSON.stringify({
    event: 'recipe_import',
    jobId: job.id,
    platform: job.platform,
    status: job.status,
    progress: job.progress,
    step,
    message: `Step ${step}: ${message}`,
    timestamp: new Date().toISOString(),
  }));
}

export function logImportRejection(message: string) {
  console.warn(JSON.stringify({ event: 'recipe_import_rejected', status: 'failed', step: 1, message: `Step 1: ${message}`, timestamp: new Date().toISOString() }));
}

export function logApiError(error: Error, fields: ApiLogFields = {}) {
  console.error(JSON.stringify({ ...fields, event: 'api_error', message: error.message, timestamp: new Date().toISOString() }));
}
