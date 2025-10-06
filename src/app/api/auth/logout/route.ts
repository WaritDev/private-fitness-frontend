export async function POST() {
  const headers = new Headers();
  headers.append('Set-Cookie', 'pf_auth=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax;');
  return new Response(null, { status: 204, headers });
}