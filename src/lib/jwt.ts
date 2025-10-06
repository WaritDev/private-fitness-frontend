import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
const alg = 'HS256';

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