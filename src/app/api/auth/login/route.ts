import { query } from '@/lib/db';
import { signAuthJWT } from '@/lib/jwt';
import { verifyPassword } from '@/lib/hash';
import type { DbUser } from '@/types/users';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'username and password required' }), { status: 400 });
    }

    const [rows] = await query<DbUser>(
      'SELECT Username, Password, Role, First_Name, Last_Name, Gmail, Is_Active FROM `USER` WHERE `Username` = ? LIMIT 1',
      [username]
    );
    const user = rows[0];
    if (!user || !(user.Is_Active === true || user.Is_Active === 1)) {
      return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 });
    }

    const ok = await verifyPassword(password, user.Password);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'invalid credentials' }), { status: 401 });
    }

    const token = await signAuthJWT({
      sub: user.Username,
      role: user.Role,
      name: `${user.First_Name} ${user.Last_Name}`,
      email: user.Gmail ?? null,
    });

    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      `pf_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`
    );

    return new Response(JSON.stringify({ user: { username: user.Username, role: user.Role } }), { status: 200, headers });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
}