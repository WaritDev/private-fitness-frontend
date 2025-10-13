import { getPool } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export async function POST(req: Request) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { username, password, firstName, lastName, phone, email } = body || {};
    if (!username || !password || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), { status: 400 });
    }

    await conn.beginTransaction();

    const passwordHash = await hashPassword(password);

    await conn.query(
      'INSERT INTO `USER` (Username, Password, Role, First_Name, Last_Name, Phone_Number, Gmail, Is_Active, Created_At, Updated_At) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())',
      [username, passwordHash, 'CUSTOMER', firstName, lastName, phone ?? null, email ?? null, 1]
    );

    await conn.query('INSERT INTO `CUSTOMER` (Username) VALUES (?)', [username]);

    await conn.commit();
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (e: any) {
    await conn.rollback();
    if (e?.code === 'ER_DUP_ENTRY') {
      return new Response(JSON.stringify({ error: 'username/email/phone already exists' }), { status: 409 });
    }
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  } finally {
    conn.release();
  }
}