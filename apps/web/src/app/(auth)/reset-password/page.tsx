'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError('Invalid token');
    
    setLoading(true);
    setError('');
    
    try {
      const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('http://localhost:4000/api/v1/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Reset failed');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md text-center">
          <h1 className="text-2xl font-bold">Password Reset</h1>
          <p>Your password has been successfully reset. All active sessions have been logged out.</p>
          <Link href="/login" className="text-blue-600 hover:underline">Login with new password</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Set New Password</h1>
        {!token && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">No reset token provided.</div>}
        {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input 
              type="password" 
              required
              disabled={!token}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !token}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
