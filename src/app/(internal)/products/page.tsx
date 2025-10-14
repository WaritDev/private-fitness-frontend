'use client';

import React from 'react';
import SessionCard from '@/components/ui/SessionCard';
import DurationCard from '@/components/ui/DurationCard';
import { Product } from '@/types/product';

function ProductsPage() {
  const [sessions, setSessions] = React.useState<Product[]>([]);
  const [durations, setDurations] = React.useState<Product[]>([]);

  React.useEffect(() => {
    async function fetchSessions() {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data.items ?? []);
    }
    async function fetchDurations() {
      const res = await fetch('/api/durations');
      const data = await res.json();
      setDurations(data.items ?? []);
    }
    fetchSessions();
    fetchDurations();
  }, []);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 16,
    overflowX: 'auto',
    padding: '12px 4px',
    WebkitOverflowScrolling: 'touch',
  };

  const itemStyle: React.CSSProperties = {
    flex: '0 0 auto',
  };

  return (
    <div className="container py-6 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Personal Training (Session)</h2>
        <div style={rowStyle} aria-label="sessions list">
          {sessions.map((session) => (
            <div key={session.Product_Id} style={itemStyle}>
              <SessionCard session={session} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Membership (Duration)</h2>
        <div style={rowStyle} aria-label="durations list">
          {durations.map((duration) => (
            <div key={duration.Product_Id} style={itemStyle}>
              <DurationCard duration={duration} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProductsPage;