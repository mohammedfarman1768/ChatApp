'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Session {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('http://localhost:4000/api/v1/auth/me', {
          credentials: 'include',
        });

        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData);

        const sessionRes = await fetch('http://localhost:4000/api/v1/auth/sessions', {
          credentials: 'include',
        });

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSessions(sessionData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      await fetch('http://localhost:4000/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      await fetch('http://localhost:4000/api/v1/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });
      router.push('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      await fetch(`http://localhost:4000/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-24">Loading...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between p-6 bg-white rounded shadow-sm">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name || user?.email}</h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
          <div className="space-x-4">
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
              Logout
            </button>
            <button onClick={handleLogoutAll} className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100">
              Logout All Devices
            </button>
          </div>
        </header>

        <section className="p-6 bg-white rounded shadow-sm">
          <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
          <ul className="space-y-4">
            {sessions.map(session => (
              <li key={session.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">IP: {session.ipAddress || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{session.userAgent}</p>
                  <p className="text-xs text-gray-400">Created: {new Date(session.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => revokeSession(session.id)}
                  className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
