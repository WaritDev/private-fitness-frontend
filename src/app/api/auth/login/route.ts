import { prisma } from '@/lib/prisma';
import { signAuthJWT } from '@/lib/jwt';
import { verifyPassword } from '@/lib/hash';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'username and password required' }), { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { Username: username },
      select: {
        Username: true, Password: true, Role: true, First_Name: true, Last_Name: true,
        Gmail: true, Profile_Image: true, Is_Active: true,
      },
    });

    if (!user || !user.Is_Active) {
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