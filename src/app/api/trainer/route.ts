import { query } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { username: string } }) {
  const username = params.username;
  const [rows] = await query<any>(
    `SELECT Username, First_Name, Last_Name, Gender, Gmail, Phone_Number, Specialty
     FROM \`USER\` WHERE Username = ? AND Role = 'TRAINER' LIMIT 1`,
    [username]
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
  }
  const u = rows[0];
  return Response.json({
    username: u.Username,
    firstName: u.First_Name,
    lastName: u.Last_Name,
    gender: u.Gender,
    email: u.Gmail,
    phone: u.Phone_Number,
    specialty: u.Specialty,
  });
}