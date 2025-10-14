import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');      // YYYY-MM-DD
  const start = searchParams.get('start');    // YYYY-MM-DD
  const end = searchParams.get('end');        // YYYY-MM-DD

  if (!date && !(start && end)) {
    return new Response(JSON.stringify({ error: 'Provide date or start/end (YYYY-MM-DD)' }), { status: 400 });
  }

  try {
    let rows: any[] = [];
    if (start && end) {
      const [r] = await query<any>(
        `SELECT s.Schedule_Id, s.Start_Time, s.End_Time, s.Trainer_Username,
                u.First_Name, u.Last_Name
         FROM \`TRAINING_SCHEDULE\` s
         JOIN \`USER\` u ON u.Username = s.Trainer_Username
         WHERE s.Schedule_Type = 'APPOINTMENT'
           AND s.Customer_Username IS NULL
           AND DATE(s.Start_Time) BETWEEN ? AND ?
         ORDER BY s.Start_Time ASC`,
        [start, end]
      );
      rows = r;
    } else if (date) {
      const [r] = await query<any>(
        `SELECT s.Schedule_Id, s.Start_Time, s.End_Time, s.Trainer_Username,
                u.First_Name, u.Last_Name
         FROM \`TRAINING_SCHEDULE\` s
         JOIN \`USER\` u ON u.Username = s.Trainer_Username
         WHERE s.Schedule_Type = 'APPOINTMENT'
           AND s.Customer_Username IS NULL
           AND DATE(s.Start_Time) = ?
         ORDER BY s.Start_Time ASC`,
        [date]
      );
      rows = r;
    }

    const items = rows.map((r: any) => ({
      id: r.Schedule_Id,
      startTime: r.Start_Time,
      endTime: r.End_Time,
      trainer: { username: r.Trainer_Username, name: `${r.First_Name} ${r.Last_Name}` },
    }));

    return Response.json({ items });
  } catch (e) {
    console.error('GET /api/schedule error:', e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
}