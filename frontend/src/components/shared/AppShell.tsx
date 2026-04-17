'use client';

import AuthProvider from './AuthProvider';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import SOSButton from './SOSButton';

interface AppShellProps {
  children: React.ReactNode;
  /** Hide SOS button (e.g. for admin pages). Default: false (shown). */
  hideSOS?: boolean;
}

/**
 * Unified app shell used by every authenticated layout.
 * - Sidebar is visible on md+ screens (hidden on mobile)
 * - MobileNav bottom tab bar is visible on mobile only
 * - Main content adapts padding + left margin for each breakpoint
 * - pb-20 on mobile so bottom nav doesn't cover content
 */
export default function AppShell({ children, hideSOS = false }: AppShellProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar />
        <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen">
          {children}
        </main>
        {!hideSOS && <SOSButton />}
        <MobileNav />
      </div>
    </AuthProvider>
  );
}
