import mysql from 'mysql2/promise';

let pool: mysql.Pool;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const u = new URL(url);
    pool = mysql.createPool({
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z',
      dateStrings: true
    });
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<[T[], any]> {
  const [rows, fields] = await getPool().query(sql, params);
  return [rows as T[], fields];
}