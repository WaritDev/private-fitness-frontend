import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { verifyTokenFromRequest } from '@/lib/jwt';

const bodySchema = z.object({
  scheduleId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const auth = await verifyTokenFromRequest(req).catch(() => null);
    if (!auth || auth.role !== 'CUSTOMER') {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
    }

    const { scheduleId } = bodySchema.parse(await req.json());

    await conn.beginTransaction();

    // Q3C.2 ตรวจว่าเหลือสิทธิ์ (lock แถว)
    const [packs] = await conn.query<any[]>(
      `SELECT Session_Id, Total_Sessions, Used_Sessions
       FROM \`CUSTOMER_SESSION\`
       WHERE Customer_Username = ? AND Status = 'ACTIVE'
       ORDER BY Created_At ASC
       FOR UPDATE`,
      [auth.sub]
    );
    const pack = packs.find(p => (p.Total_Sessions - p.Used_Sessions) > 0);
    if (!pack) {
      await conn.rollback();
      return new Response(JSON.stringify({ error: 'no remaining sessions' }), { status: 403 });
    }

    // ตรวจว่า slot ยังว่าง (lock แถว)
    const [rows] = await conn.query<any[]>(
      `SELECT Schedule_Id, Trainer_Username, Customer_Username, Schedule_Type, Start_Time, End_Time
       FROM \`TRAINING_SCHEDULE\`
       WHERE Schedule_Id = ?
       FOR UPDATE`,
      [scheduleId]
    );
    if (!rows.length) {
      await conn.rollback();
      return new Response(JSON.stringify({ error: 'slot not found' }), { status: 404 });
    }
    const slot = rows[0];
    if (slot.Schedule_Type !== 'APPOINTMENT' || slot.Customer_Username) {
      await conn.rollback();
      return new Response(JSON.stringify({ error: 'slot not available' }), { status: 409 });
    }

    // อัปเดตแถวเดิมให้เป็นการจอง (ผูกลูกค้า+session)
    await conn.query(
      `UPDATE \`TRAINING_SCHEDULE\`
       SET Customer_Username = ?, Session_Id = ?, Updated_At = NOW()
       WHERE Schedule_Id = ?`,
      [auth.sub, pack.Session_Id, scheduleId]
    );

    // ตัดสิทธิ์ 1 ครั้ง
    await conn.query(
      `UPDATE \`CUSTOMER_SESSION\`
       SET Used_Sessions = Used_Sessions + 1, Updated_At = NOW()
       WHERE Session_Id = ?`,
      [pack.Session_Id]
    );

    // Log การจอง (มีตาราง CUSTOMER_LOG ตามข้อกำหนด)
    await conn.query(
      `INSERT INTO \`CUSTOMER_LOG\` (Customer_Username, Log_Type, Created_At)
       VALUES (?, 'BOOK_SESSION', NOW())`,
      [auth.sub]
    );

    await conn.commit();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    await conn.rollback().catch(() => {});
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  } finally {
    conn.release();
  }
}