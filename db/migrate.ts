import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}


async function main() {
  const cfg = parseDb();
  const pool = mysql.createPool({
    ...cfg,
    waitForConnections: true,
    connectionLimit: 2,
    multipleStatements: true,
  });

  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const [appliedRows] = await conn.query('SELECT name FROM _migrations ORDER BY applied_at ASC') as [Array<{ name: string }>, any];
    const applied = new Set(appliedRows.map(r => r.name));

    for (const file of files) {
      if (applied.has(file)) continue;
      const fp = path.join(migrationsDir, file);
      console.log(`Applying migration: ${file}`);
      await conn.beginTransaction();
      try {
        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(fp, 'utf8');
          await conn.query(sql);
        } else {
          const mod = await import(pathToFileURL(fp).href);
          if (typeof mod.up !== 'function') {
            throw new Error(`Migration ${file} must export async function up(conn)`);
          }
          await mod.up(conn);
        }
        await conn.query('INSERT INTO _migrations (name) VALUES (?)', [file]);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      }
    }

    console.log('Migrations: up to date');
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});