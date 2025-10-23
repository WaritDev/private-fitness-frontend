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
});

type ProductRow = RowDataPacket & {
  Product_Id: number;
  Product_Category: 'SESSION' | 'DURATION';
  Duration_Days: number | null;
};
type UserRow = RowDataPacket & { Username: string };

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation error', issues: parsed.error.issues }, { status: 400 });
  }

  const { productId, customerUsername, pricePaid, discountAmount } = parsed.data;

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Validate product is DURATION and get duration days
    const [prodRows] = await conn.query<ProductRow[]>(
      `SELECT Product_Id, Product_Category, Duration_Days
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
    if (product.Product_Category !== 'DURATION' || !product.Duration_Days) {
      await conn.rollback();
      return NextResponse.json({ error: 'invalid product type' }, { status: 400 });
    }

    // 2) Validate customer
    const [customerRows] = await conn.query<UserRow[]>(
      `SELECT Username FROM \`USER\` WHERE Username = ? AND Role = 'CUSTOMER' LIMIT 1`,
      [customerUsername]
    );
    if (!customerRows[0]) {
      await conn.rollback();
      return NextResponse.json({ error: 'customer not found' }, { status: 404 });
    }

    // 3) Sales username from header or SYSTEM
    const hdr = headers();
    const salesUsername = (await hdr).get('x-sales-username') || 'SYSTEM';

    // 4) Insert CUSTOMER_DURATION
    const [ins] = await conn.query<ResultSetHeader>(
      `INSERT INTO CUSTOMER_DURATION
        (Customer_Username, Product_Id, Price_Paid, Discount_Amount,
         Purchase_Date, Sales_Username, Start_Date, End_Date, Status)
       VALUES (?, ?, ?, ?, NOW(), ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 'ACTIVE')`,
      [
        customerUsername,
        productId,
        pricePaid,
        discountAmount,
        salesUsername,
        product.Duration_Days,
      ]
    );

    await conn.commit();
    return NextResponse.json(
      { ok: true, durationId: ins.insertId, status: 'ACTIVE', durationDays: product.Duration_Days },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error('POST /api/durations/purchase error:', error);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}