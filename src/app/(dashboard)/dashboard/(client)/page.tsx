'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';

// This page is a Client Component - authentication will be handled by Clerk
const HeaderClient = dynamic(() => import('@/components/HeaderClient'), { ssr: false });

export default function DashboardClientPage() {
  const { user, isLoaded } = useUser();
  const [online, setOnline] = useState<boolean | null>(null);
  const [health, setHealth] = useState<'pending' | 'ok' | 'fail'>('pending');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : null);
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);

    fetch('/api/health')
      .then(async (r) => {
        if (r.ok) {
          setHealth('ok');
          const j = await r.json().catch(() => null);
          setDetails(`health ok @ ${j?.timestamp ?? 'n/a'}`);
        } else {
          setHealth('fail');
          setDetails(`health status ${r.status}`);
        }
      })
      .catch((e) => {
        setHealth('fail');
        setDetails(`health error: ${String(e)}`);
      });

    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
    };
  }, []);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <HeaderClient firstName={user?.firstName || 'User'} />
      <div className="space-y-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress || 'Not available'}
                </div>
                <div>
                  <strong>Name:</strong> {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set'}
                </div>
                <div>
                  <strong>Provider:</strong> Clerk OAuth
                </div>
                <div>
                  <strong>Authentication:</strong> Clerk v6 with Next.js 15
                </div>

                {/* Debug Panel (temporary) */}
                <div className="mt-6 p-4 rounded-md border">
                  <h4 className="font-semibold mb-2">Debug: Connectivity</h4>
                  <div className="text-sm space-y-1">
                    <div>navigator.onLine: <span className="font-mono">{String(online)}</span></div>
                    <div>GET /api/health: <span className="font-mono">{health}</span></div>
                    <div>details: <span className="font-mono break-all">{details}</span></div>
                  </div>
                  <div className="mt-2">
                    <button
                      className="px-3 py-1 border rounded hover:bg-accent"
                      onClick={() => {
                        setHealth('pending');
                        setDetails('retrying...');
                        fetch('/api/health')
                          .then(async (r) => {
                            if (r.ok) {
                              setHealth('ok');
                              const j = await r.json().catch(() => null);
                              setDetails(`health ok @ ${j?.timestamp ?? 'n/a'}`);
                            } else {
                              setHealth('fail');
                              setDetails(`health status ${r.status}`);
                            }
                          })
                          .catch((e) => {
                            setHealth('fail');
                            setDetails(`health error: ${String(e)}`);
                          });
                      }}
                    >
                      Retry health
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-900 mb-3">🎉 Clerk v6 Authentication Active!</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>✅ Clerk v6.28.1 installed and configured</li>
                  <li>✅ Next.js 15.4.5 compatibility confirmed</li>
                  <li>✅ Authentication middleware active</li>
                  <li>✅ Sign-in/Sign-up pages ready</li>
                </ul>
              </div>

              <div className="mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Set up your wedding details</li>
                    <li>• Add your partner</li>
                    <li>• Start planning your big day!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
