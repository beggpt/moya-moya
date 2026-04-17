'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

const publicPaths = ['/', '/login', '/register'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadFromStorage, updateUser } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // On first mount with a user, refresh from /auth/me so onboardingCompleted
  // is accurate even if localStorage was populated before that field was saved.
  useEffect(() => {
    if (!user || refreshed || isLoading) return;
    let cancelled = false;
    api.get('/auth/me').then((res) => {
      if (cancelled || !res.data) return;
      const fresh = res.data;
      updateUser({
        name: fresh.name,
        image: fresh.image,
        role: fresh.role,
        profile: fresh.profile ?? null,
      });
      setRefreshed(true);
    }).catch(() => setRefreshed(true));
    return () => { cancelled = true; };
  }, [user, refreshed, isLoading, updateUser]);

  useEffect(() => {
    if (isLoading) return;

    // /emergency/:token is a public card page; /emergency (no token) is authenticated
    const isPublic = publicPaths.some((p) => pathname === p) || /^\/emergency\/[^/]+$/.test(pathname);

    if (!user && !isPublic) {
      router.push('/login');
    }

    // Redirect to onboarding if not completed — but only after we've refreshed
    // from /auth/me (otherwise stale localStorage could falsely trigger it)
    if (user && user.role === 'PATIENT' && refreshed && (!user.profile || !user.profile.onboardingCompleted) && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [user, isLoading, pathname, router, refreshed]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <p className="text-neutral-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
