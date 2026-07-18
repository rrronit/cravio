import { app } from './app';
import { createServices } from './services/container';
import type { Bindings } from './models/app.model';
import type { ImportQueueMessage } from './models/import.model';

const terminalStatuses = new Set(['ready', 'failed']);

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<ImportQueueMessage>, env: Bindings) {
    const services = createServices(env.DB, env);

    for (const message of batch.messages) {
      try {
        const job = await services.imports.advance(message.body.id, message.body.userId);
        if (!terminalStatuses.has(job.status)) {
          await env.IMPORT_QUEUE.send(message.body);
        }
        message.ack();
      } catch {
        message.retry();
      }
    }
  },
};
