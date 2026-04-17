'use client';
import AppShell from '@/components/shared/AppShell';

export default function HydrationLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
