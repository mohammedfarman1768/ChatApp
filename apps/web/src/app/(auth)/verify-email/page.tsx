'use client';
import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailForm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No token provided');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyToken = async () => {
      try {
        const csrfRes = await fetch('http://localhost:4000/api/v1/auth/csrf', { credentials: 'include' });
        const { csrfToken } = await csrfRes.json();

        const res = await fetch('http://localhost:4000/api/v1/auth/verify-email', {
          method: 'POST',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Verification failed');
        }

        setStatus('success');
      } catch (err: unknown) {
        setStatus('error');
        setMessage((err instanceof Error ? err.message : String(err)));
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md text-center">
        <h1 className="text-2xl font-bold">Email Verification</h1>
        
        {status === 'loading' && <p>Verifying your email...</p>}
        
        {status === 'success' && (
          <div>
            <p className="text-green-600 mb-4">Your email has been successfully verified.</p>
            <Link href="/login" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Continue to Login</Link>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <p className="text-red-500 mb-4">{message}</p>
            <Link href="/login" className="text-blue-600 hover:underline">Return to login</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
