import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

import { fileURLToPath, pathToFileURL } from 'node:url';

// define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseDb() {
  const url = process.env.DATABASE_URL!;
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
    const seedsDir = path.resolve(__dirname, 'seeds');
    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const fp = path.join(seedsDir, file);
      console.log(`Running seed: ${file}`);
      await conn.beginTransaction();
      try {
        if (file.endsWith('.sql')) {
          const sql = fs.readFileSync(fp, 'utf8');
          await conn.query(sql);
        } else {
          const mod = await import(pathToFileURL(fp).href);
          const runner = mod.default || mod.run || mod.seed;
          if (typeof runner !== 'function') {
            throw new Error(`Seed ${file} must export default/run/seed(conn)`);
          }
          await runner(conn);
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      }
    }

    console.log('Seeding completed');
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});