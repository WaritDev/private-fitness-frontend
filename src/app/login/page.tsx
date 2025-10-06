'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Login failed');
      return;
    }
    router.push('/');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={onSubmit} className="w-full max-w-sm p-6 rounded-2xl shadow border bg-white">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">Login</h1>

        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <input
          className="w-full rounded-xl bg-[#F5F5F5] px-4 py-3 mb-3 outline-none"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="e.g. sophia_c"
          required
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          className="w-full rounded-xl bg-[#F5F5F5] px-4 py-3 mb-4 outline-none"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="********"
          required
        />

        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-[#00C853] text-white font-semibold py-3"
          type="submit"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}