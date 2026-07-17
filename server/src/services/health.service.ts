export class HealthService {
  constructor(private readonly db: D1Database) {}

  async getStatus() {
    const check = await this.db.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return {
      ok: check?.ok === 1,
      service: 'cravio-api',
      database: 'd1',
      timestamp: new Date().toISOString(),
    };
  }
}
