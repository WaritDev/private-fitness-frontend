import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { z } from 'zod';

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const schema = z.object({
  username: z.string().regex(USERNAME_RE, 'invalid username'),
  password: z.string().regex(PASSWORD_RE, 'weak password'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),
  dateOfBirth: z.string().date().nullable().optional().or(z.literal('').transform(() => null)).optional().nullable(),
  phone: z.string().min(1),
  email: z.string().email().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'validation error', issues: parsed.error.issues }), { status: 400 });
    }
    const {
      username,
      password,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      phone,
      email,
    } = parsed.data;

    // Q1C.1: ตรวจสอบค่าซ้ำ
    const [rows] = await conn.query(
      'SELECT COUNT(*) AS c FROM `USER` WHERE `Username` = ?',
      [username]
    );
    const countRows = rows as { c: number }[];
    if ((countRows[0]?.c ?? 0) > 0) {
      return new Response(JSON.stringify({ error: 'username already exists' }), { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await conn.beginTransaction();

    // INSERT USER
    await conn.query(
      `INSERT INTO \`USER\`
        (Username, Password, Role, First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Gmail, Is_Active, Created_At, Updated_At)
       VALUES (?, ?, 'CUSTOMER', ?, ?, ?, ?, ?, LOWER(?), 1, NOW(), NOW())`,
      [
        username,
        passwordHash,
        firstName,
        lastName,
        gender ?? null,
        dateOfBirth ?? null,
        phone || null,
        email ?? null,
      ]
    );

    // INSERT CUSTOMER (ฟิลด์อื่นๆ ใส่ null ตามโจทย์)
    await conn.query(
      `INSERT INTO \`CUSTOMER\`
        (Username, Health_Info, Address, Company_Name, Company_Position, Marital_Status, Emergency_Contact_Name, Emergency_Contact_Relationship, Emergency_Contact_Phone, Marketing_Source)
       VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      [username]
    );

    await conn.commit();
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (e: any) {
    await conn.rollback().catch(() => {});
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  } finally {
    conn.release();
  }
}