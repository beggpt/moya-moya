'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const publicPaths = ['/', '/login', '/register'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isLoading) return;

    // /emergency/:token is a public card page; /emergency (no token) is authenticated
    const isPublic = publicPaths.some((p) => pathname === p) || /^\/emergency\/[^/]+$/.test(pathname);

    if (!user && !isPublic) {
      router.push('/login');
    }

    // Redirect to onboarding if not completed
    if (user && user.role === 'PATIENT' && (!user.profile || !user.profile.onboardingCompleted) && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [user, isLoading, pathname, router]);

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
