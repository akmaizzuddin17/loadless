import 'server-only';
import postgres from 'postgres';
import { prepareQuery, normalizeRow } from './sql-compat';

let pool: ReturnType<typeof postgres> | undefined;
function connection() {
  if (!process.env.DATABASE_URL) throw new Error('Missing database configuration');
  return pool ??= postgres(process.env.DATABASE_URL, {
    prepare: false, max: 3, idle_timeout: 20, connect_timeout: 15, ssl: 'require',
  });
}
export class Statement {
  constructor(readonly query: string, readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.query, values); }
  async all() {
    const rows = await connection().unsafe(prepareQuery(this.query), this.values as never[]);
    return { results: rows.map(normalizeRow) };
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return ((await this.all()).results[0] as T) ?? null;
  }
  async run() {
    const rows = await connection().unsafe(prepareQuery(this.query), this.values as never[]);
    return { meta: { changes: rows.count } };
  }
}
export const database = {
  prepare(query: string) { return new Statement(query); },
  async batch(statements: Statement[]) {
    return connection().begin(async tx => {
      for (const statement of statements) await tx.unsafe(prepareQuery(statement.query), statement.values as never[]);
    });
  },
};
