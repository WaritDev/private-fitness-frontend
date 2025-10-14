import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { verifyPassword } from "@/lib/hash";
import { signAuthJWT } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body ?? {};
  if (!username || !password) {
    return NextResponse.json({ error: "missing credentials" }, { status: 400 });
  }

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<any[]>(
      "SELECT Username, Password, Role, First_Name, Last_Name FROM `USER` WHERE Username = ? LIMIT 1",
      [username]
    );
    const u = Array.isArray(rows) ? rows[0] : null;
    if (!u)
      return NextResponse.json(
        { error: "invalid credentials" },
        { status: 401 }
      );

    const ok = await verifyPassword(password, u.Password);
    if (!ok)
      return NextResponse.json(
        { error: "invalid credentials" },
        { status: 401 }
      );

    const token = await signAuthJWT({ sub: u.Username, role: u.Role });

    const res = NextResponse.json({
      user: {
        sub: u.Username,
        role: u.Role,
        firstName: u.First_Name,
        lastName: u.Last_Name,
      },
    });
    res.cookies.set("pf_auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } finally {
    conn.release();
  }
}
