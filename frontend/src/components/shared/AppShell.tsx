'use client';

import AuthProvider from './AuthProvider';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import QuickActionsFAB from './QuickActionsFAB';

interface AppShellProps {
  children: React.ReactNode;
  /** Hide the quick actions FAB (e.g. for admin pages). Default: false (shown). */
  hideFAB?: boolean;
}

/**
 * Unified app shell used by every authenticated layout.
 * - Sidebar is visible on md+ screens (hidden on mobile)
 * - MobileNav bottom tab bar is visible on mobile only
 * - QuickActionsFAB floats bottom-right with a radial fan of shortcuts
 *   (log symptom, log BP, log exercise, new post) on open
 * - Main content adapts padding + left margin for each breakpoint
 * - pb-24 on mobile so bottom nav doesn't cover content
 */
export default function AppShell({ children, hideFAB = false }: AppShellProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50 overflow-x-hidden">
        <Sidebar />
        <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen min-w-0 max-w-full">
          {children}
        </main>
        {!hideFAB && <QuickActionsFAB />}
        <MobileNav />
      </div>
    </AuthProvider>
  );
}
