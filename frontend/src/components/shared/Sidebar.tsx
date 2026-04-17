'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  LayoutDashboard, Activity, Pill, Heart, Brain, Calendar,
  Shield, Dumbbell, User, LogOut, Users, BarChart3,
  BookOpen, ChevronLeft, ChevronRight, UtensilsCrossed,
  MessageCircle, UserPlus, Home, Bell, Newspaper
} from 'lucide-react';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

const patientLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/notifications', label: 'Notifications', icon: Bell, notifBell: true },
  { href: '/forum', label: 'Forum', icon: MessageCircle },
  { href: '/friends', label: 'Friends', icon: UserPlus },
  { href: '/recipes', label: 'Recipes', icon: UtensilsCrossed },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/symptoms', label: 'Symptoms', icon: Activity },
  { href: '/blood-pressure', label: 'Blood Pressure', icon: Heart },
  { href: '/cognitive', label: 'Cognitive Tests', icon: Brain },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/exercise', label: 'Exercise', icon: Dumbbell },
  { href: '/emergency', label: 'Emergency Card', icon: Shield },
  { href: '/profile', label: 'Profile', icon: User },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reports', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/content', label: 'Content', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isPatient = user?.role !== 'ADMIN';
  const links = isPatient ? patientLinks : adminLinks;

  useEffect(() => {
    if (!isPatient) return;
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (!cancelled) {
          const count = res.data?.count ?? res.data?.unreadCount ?? 0;
          setUnreadCount(count);
        }
      } catch {
        // ignore
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isPatient]);

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
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {links.map((link: any) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const showBadge = link.notifBell && unreadCount > 0;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={clsx(
                    isActive ? 'nav-link-active' : 'nav-link',
                    collapsed && 'justify-center px-2',
                    'relative'
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <span className="relative shrink-0">
                    <link.icon size={20} />
                    {showBadge && collapsed && (
                      <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2.5 h-2.5 border-2 border-white" />
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{link.label}</span>
                      {showBadge && (
                        <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </>
                  )}
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
          title="Log out"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
