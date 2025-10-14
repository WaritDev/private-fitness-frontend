import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
const alg = 'HS256';
export type AuthPayload = { sub: string; role: string; [k: string]: any };

export async function signAuthJWT(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyAuthJWT(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

function extractTokenFromRequest(req: NextRequest | Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();

  const names = ['pf_auth', 'auth', 'auth_token', 'token', 'access_token']; // เพิ่ม pf_auth
  const anyReq = req as any;

  if (anyReq?.cookies?.get) {
    for (const n of names) {
      const v = anyReq.cookies.get(n)?.value;
      if (v) return v;
    }
  }
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [k, ...rest] = part.split('=');
      const v = rest.join('=');
      if (names.includes(k?.trim()) && v) return decodeURIComponent(v.trim());
    }
  }
  return null;
}
export async function verifyTokenFromRequest(req: NextRequest | Request): Promise<AuthPayload> {
  const token = extractTokenFromRequest(req);
  if (!token) throw new Error('missing token');
  const payload = await verifyAuthJWT(token);
  if (!payload || typeof payload !== 'object') throw new Error('invalid token');
  const { sub, role } = payload as any;
  if (!sub || !role) throw new Error('invalid token payload');
  return payload as AuthPayload;
}