import { verifyAuthJWT } from '@/lib/jwt';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('pf_auth='))?.split('=')[1];

  if (!token) return new Response(JSON.stringify({ authenticated: false }), { status: 200 });

  try {
    const payload = await verifyAuthJWT(token);
    return new Response(JSON.stringify({ authenticated: true, user: payload }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ authenticated: false }), { status: 200 });
  }
}