'use client';
import React from 'react';
import SessionCard from '@/components/ui/SessionCard';
import DurationCard from '@/components/ui/DurationCard';
import { Product } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function ProductsPage() {
  const [sessions, setSessions] = React.useState<Product[]>([]);
  const [durations, setDurations] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/sessions`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (data.status === 'OK' && data.result) {
          // Map Golang response to Product type
          const products: Product[] = data.result.map((item: any) => ({
            productId: item.id,
            name: item.name,
            productType: item.type,
            productCategory: item.category,
            listPrice: item.listPrice,
            price: item.listPrice,
            sessionAmount: item.sessionAmount,
            durationDays: item.durationDays,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          setSessions(products);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('ไม่สามารถโหลดข้อมูล Sessions ได้');
      }
    }

    async function fetchDurations() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/durations`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (data.status === 'OK' && data.result) {
          // Map Golang response to Product type
          const products: Product[] = data.result.map((item: any) => ({
            productId: item.id,
            name: item.name,
            productType: item.type,
            productCategory: item.category,
            listPrice: item.listPrice,
            price: item.listPrice,
            sessionAmount: item.sessionAmount,
            durationDays: item.durationDays,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          setDurations(products);
        }
      } catch (err) {
        console.error('Error fetching durations:', err);
        setError('ไม่สามารถโหลดข้อมูล Durations ได้');
      }
    }

    Promise.all([fetchSessions(), fetchDurations()]).finally(() => {
      setLoading(false);
    });
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

  if (loading) {
    return (
      <div className="container py-6">
        <div className="text-center">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Personal Training (Session)</h2>
        {sessions.length === 0 ? (
          <div className="text-gray-500">ไม่มีแพ็กเกจ Session</div>
        ) : (
          <div style={rowStyle} aria-label="sessions list">
            {sessions.map((session) => (
              <div key={session.productId} style={itemStyle}>
                <SessionCard session={session} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Membership (Duration)</h2>
        {durations.length === 0 ? (
          <div className="text-gray-500">ไม่มีแพ็กเกจ Duration</div>
        ) : (
          <div style={rowStyle} aria-label="durations list">
            {durations.map((duration) => (
              <div key={duration.productId} style={itemStyle}>
                <DurationCard duration={duration} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProductsPage;