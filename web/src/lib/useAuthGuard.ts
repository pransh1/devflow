// redirects to login if not authenticated, and hydrates the auth store on mount

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    } else {
      setReady(true);
    }
  }, []);

  return ready;
};