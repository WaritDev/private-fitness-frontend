import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

const schema = z.object({
  productId: z.number().int().positive(),
  customerUsername: z.string().min(1),
  pricePaid: z.number().nonnegative(),
  discountAmount: z.number().min(0),
  trainerUsername: z.string().min(1),
});

type ProductRow = RowDataPacket & {
  Product_Id: number;
  Product_Category: 'SESSION' | 'DURATION';
  Session_Amount: number | null;
};
type UserRow = RowDataPacket & { Username: string };

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation error', issues: parsed.error.issues }, { status: 400 });
  }

  const { productId, customerUsername, pricePaid, discountAmount, trainerUsername } = parsed.data;

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Validate product is SESSION and get total sessions
    const [prodRows] = await conn.query<ProductRow[]>(
      `SELECT Product_Id, Product_Category, Session_Amount
       FROM PRODUCT
       WHERE Product_Id = ?
       LIMIT 1`,
      [productId]
    );
    const product = prodRows[0];
    if (!product) {
      await conn.rollback();
      return NextResponse.json({ error: 'product not found' }, { status: 404 });
    }
    if (product.Product_Category !== 'SESSION' || !product.Session_Amount) {
      await conn.rollback();
      return NextResponse.json({ error: 'invalid product type' }, { status: 400 });
    }

    // 2) Validate customer and trainer
    const [[customerRows], [trainerRows]] = await Promise.all([
      conn.query<UserRow[]>(
        `SELECT Username FROM \`USER\` WHERE Username = ? AND Role = 'CUSTOMER' LIMIT 1`,
        [customerUsername]
      ),
      conn.query<UserRow[]>(
        `SELECT Username FROM \`USER\` WHERE Username = ? AND Role = 'TRAINER' AND Is_Active = 1 LIMIT 1`,
        [trainerUsername]
      ),
    ]);
    if (!customerRows[0]) {
      await conn.rollback();
      return NextResponse.json({ error: 'customer not found' }, { status: 404 });
    }
    if (!trainerRows[0]) {
      await conn.rollback();
      return NextResponse.json({ error: 'trainer not found' }, { status: 404 });
    }

    // 3) Sales username from header or SYSTEM
    const hdr = headers();
    const salesUsername = (await hdr).get('x-sales-username') || 'SYSTEM';

    // 4) Insert CUSTOMER_SESSION
    // End_Date อาจเป็น null ตามนโยบาย ใช้ NULL ไว้ก่อน
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO CUSTOMER_SESSION
        (Customer_Username, Product_Id, Price_Paid, Discount_Amount, Trainer_Username,
         Purchase_Date, Sales_Username, Start_Date, End_Date, Status, Used_Sessions, Total_Sessions)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), NULL, 'ACTIVE', 0, ?)`,
      [
        customerUsername,
        productId,
        pricePaid,
        discountAmount,
        trainerUsername,
        salesUsername,
        product.Session_Amount,
      ]
    );

    await conn.commit();
    return NextResponse.json(
      { ok: true, sessionId: ins.insertId, status: 'ACTIVE', totalSessions: product.Session_Amount },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error('POST /api/sessions/purchase error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}