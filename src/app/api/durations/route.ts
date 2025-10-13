import { query } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await query<any>(
      `SELECT Product_Id, Name, Product_Type, Product_Category, List_Price, Duration_Days, Session_Amount, Is_Active
       FROM PRODUCTS
       WHERE Product_Type = 'DURATION' AND Is_Active = 1
       ORDER BY List_Price ASC`
    );

    const items = rows.map((r: any) => ({
      Product_Id: r.Product_Id,
      Name: r.Name,
      Product_Type: r.Product_Type,
      Product_Category: r.Product_Category,
      Price: Number(r.List_Price),           // map → Price
      Duration_Days: r.Duration_Days,
      Session_Amount: r.Session_Amount,
      Is_Active: !!r.Is_Active,
    }));

    return Response.json({ items });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
}