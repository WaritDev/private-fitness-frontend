import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/hash';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, firstName, lastName, phone, email } = body || {};
    if (!username || !password || !firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'missing required fields' }), { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx: any) => {
      await tx.user.create({
        data: {
          Username: username,
          Password: passwordHash,
          Role: 'CUSTOMER',
          First_Name: firstName,
          Last_Name: lastName,
          Phone_Number: phone ?? null,
          Gmail: email ?? null,
          Is_Active: true,
        },
      });

      await tx.customer.create({
        data: { Username: username },
      });
    });

    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'username/email/phone already exists' }), { status: 409 });
    }
    console.error(e);
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500 });
  }
}