import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { z } from 'zod';

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().min(1),
  email: z.string().email().optional().nullable(),

  // Additional Info (Step 2)
  marketingSource: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelationship: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  companyPosition: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  healthInfo: z.string().optional().nullable(),

  // Credentials (Step 4)
  username: z.string().regex(USERNAME_RE, 'invalid username'),
  password: z.string().regex(PASSWORD_RE, 'weak password'),
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
      username, password,
      firstName, lastName, gender, dateOfBirth, phone, email,
      marketingSource, emergencyContactPhone, emergencyContactRelationship, emergencyContactName,
      maritalStatus, companyPosition, companyName, address, healthInfo,
    } = parsed.data;

    // check dup
    const [dup] = await conn.query<any[]>('SELECT 1 FROM `USER` WHERE `Username` = ? LIMIT 1', [username]);
    if ((dup as any[]).length > 0) {
      return new Response(JSON.stringify({ error: 'username already exists' }), { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO \`USER\`
        (Username, Password, Role, First_Name, Last_Name, Gender, Date_of_Birth, Phone_Number, Gmail, Is_Active, Created_At, Updated_At)
       VALUES (?, ?, 'CUSTOMER', ?, ?, ?, ?, ?, LOWER(?), 1, NOW(), NOW())`,
      [
        username,
        passwordHash,
        firstName,
        lastName,
        gender || null,
        dateOfBirth || null,
        phone || null,
        email || null,
      ]
    );

    await conn.query(
      `INSERT INTO \`CUSTOMER\`
        (Username, Health_Info, Address, Company_Name, Company_Position, Marital_Status,
         Emergency_Contact_Name, Emergency_Contact_Relationship, Emergency_Contact_Phone, Marketing_Source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        healthInfo || null,
        address || null,
        companyName || null,
        companyPosition || null,
        maritalStatus || null,
        emergencyContactName || null,
        emergencyContactRelationship || null,
        emergencyContactPhone || null,
        marketingSource || null,
      ]
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