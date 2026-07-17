export const createHealthService = (db: D1Database) => ({
  getStatus: async () => {
    const check = await db.prepare('SELECT 1 AS ok').first<{ ok: number }>();
    return { ok: check?.ok === 1, service: 'cravio-api', database: 'd1', timestamp: new Date().toISOString() };
  },
});
