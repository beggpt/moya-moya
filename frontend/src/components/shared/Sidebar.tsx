'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
  LayoutDashboard, Activity, Pill, Heart, Brain, Calendar,
  FileText, Shield, Dumbbell, User, LogOut, Users, BarChart3,
  BookOpen, ChevronLeft, ChevronRight, UtensilsCrossed
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const patientLinks = [
  { href: '/dashboard', label: 'Pregled', icon: LayoutDashboard },
  { href: '/symptoms', label: 'Simptomi', icon: Activity },
  { href: '/medications', label: 'Lijekovi', icon: Pill },
  { href: '/blood-pressure', label: 'Krvni tlak', icon: Heart },
  { href: '/cognitive', label: 'Kognitivni testovi', icon: Brain },
  { href: '/appointments', label: 'Termini', icon: Calendar },
  { href: '/exercise', label: 'Vježba', icon: Dumbbell },
  { href: '/recipes', label: 'Recepti', icon: UtensilsCrossed },
  { href: '/reports', label: 'Izvještaji', icon: FileText },
  { href: '/emergency', label: 'Hitna kartica', icon: Shield },
  { href: '/profile', label: 'Profil', icon: User },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Korisnici', icon: Users },
  { href: '/admin/reports', label: 'Analitika', icon: BarChart3 },
  { href: '/admin/content', label: 'Sadržaj', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const links = user?.role === 'ADMIN' ? adminLinks : patientLinks;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full bg-white border-r border-neutral-200 z-40 transition-all duration-200 flex flex-col',
      collapsed ? 'w-[72px]' : 'w-64'
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between min-h-[72px]">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-neutral-800">MoyaMoya</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
          aria-label={collapsed ? 'Proširi izbornik' : 'Smanji izbornik'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    isActive ? 'nav-link-active' : 'nav-link',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <link.icon size={20} className="shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info & logout */}
      <div className="p-3 border-t border-neutral-200">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-neutral-800 truncate">{user.name}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx('nav-link text-neutral-500 hover:text-danger w-full', collapsed && 'justify-center px-2')}
          title="Odjava"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Odjava</span>}
        </button>
      </div>
    </aside>
  );
}
