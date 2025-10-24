import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';

type TrainerRow = RowDataPacket & {
  Username: string;
  First_Name: string | null;
  Last_Name: string | null;
};

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<TrainerRow[]>(
      `
      SELECT Username, First_Name, Last_Name
      FROM \`USER\`
      WHERE Role = 'TRAINER' AND Is_Active = 1
      ORDER BY First_Name, Last_Name, Username
      `
    );

    const items = (rows || []).map((r) => ({
      username: r.Username,
      name: [r.First_Name, r.Last_Name].filter(Boolean).join(' ') || r.Username,
    }));

    return NextResponse.json({ items }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/trainers error:', error);
    return NextResponse.json({ error: 'Failed to fetch trainers' }, { status: 500 });
  }
}