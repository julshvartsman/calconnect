/**
 * Detect Prisma / Postgres errors that should not crash the whole page.
 * Used when Supabase pooler + prepared statements conflict, or DB is unreachable.
 */
export function isDbError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    /Can't reach database server|Connection refused|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(msg) ||
    /prepared statement.*(does not exist|already exists)|ConnectorError|P1001|P1017|42P05/i.test(msg)
  );
}
