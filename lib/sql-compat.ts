// Keeps the existing parameterized repository queries while migrating SQLite to PostgreSQL.
// This accepts source-code SQL only, never SQL supplied by a request.
export function prepareQuery(source: string) {
  const ignore = /^INSERT OR IGNORE /i.test(source);
  let sql = source.replace(/^INSERT OR IGNORE /i, 'INSERT ')
    .replace('instr(lower(p.name),lower(?))', 'strpos(lower(p.name),lower(?))')
    .replace('instr(p.username,lower(?))', 'strpos(p.username,lower(?))');
  let index = 0;
  sql = sql.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?|\b(user|end|senderName|recipientName)\b/g, token => {
    if (token === '?') return `$${++index}`;
    if (token.startsWith("'") || token.startsWith('"')) return token;
    return `"${token}"`;
  });
  if (ignore) sql += ' ON CONFLICT DO NOTHING';
  return sql;
}
export function normalizeRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
    ['cursor','created','start','end','likes','comments','n','revision'].includes(key) && typeof value === 'string' ? Number(value) : value,
  ]));
}
