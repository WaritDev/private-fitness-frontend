import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

type TrainerDetailRow = RowDataPacket & {
  Username: string;
  First_Name: string | null;
  Last_Name: string | null;
  Gender: string | null;
  Gmail: string | null;
  Phone_Number: string | null;
};

export async function GET(_: Request, ctx: { params: { username: string } }) {
  try {
    const username = ctx?.params?.username;
    if (!username) return NextResponse.json({ error: 'username is required' }, { status: 400 });

    const pool = getPool();
    const [rows] = await pool.query<TrainerDetailRow[]>(
      `
      SELECT Username, First_Name, Last_Name, Gender, Gmail, Phone_Number
      FROM \`USER\`
      WHERE Username = ? AND Role = 'TRAINER'
      LIMIT 1
      `,
      [username]
    );

    const r = rows?.[0];
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const data = {
      username: r.Username,
      firstName: r.First_Name,
      lastName: r.Last_Name,
      name: [r.First_Name, r.Last_Name].filter(Boolean).join(' ') || r.Username,
      gender: r.Gender,
      email: r.Gmail,
      phone: r.Phone_Number,
    };

    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/trainers/[username] error:', error);
    return NextResponse.json({ error: 'Failed to fetch trainer' }, { status: 500 });
  }
}