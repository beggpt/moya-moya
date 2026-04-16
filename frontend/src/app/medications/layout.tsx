'use client';

import AuthProvider from '@/components/shared/AuthProvider';
import Sidebar from '@/components/shared/Sidebar';
import SOSButton from '@/components/shared/SOSButton';

export default function MedicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar />
        <main className="ml-64 p-8 min-h-screen">{children}</main>
        <SOSButton />
      </div>
    </AuthProvider>
  );
}
