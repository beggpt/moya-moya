'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import {
  Home, MessageCircle, UserPlus, Pill, Activity, Heart, Brain,
  Calendar, Dumbbell, Shield, User, Bell, Newspaper, UtensilsCrossed,
  Menu, X, LogOut, LayoutDashboard, Users, BarChart3, BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

const primary = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/forum', label: 'Forum', icon: MessageCircle },
  { href: '/notifications', label: 'Alerts', icon: Bell, showBadge: true },
  { href: '/friends', label: 'Friends', icon: UserPlus },
];

const allLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
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

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (!cancelled) setUnreadCount(res.data?.count ?? 0);
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const activeLinks = isAdmin ? adminLinks.slice(0, 3) : primary;

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around">
          {activeLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const showBadge = (link as any).showBadge && unreadCount > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium relative',
                  isActive ? 'text-primary-600' : 'text-neutral-500'
                )}
              >
                <span className="relative">
                  <link.icon size={22} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full min-w-[14px] h-[14px] px-1 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-neutral-500"
            aria-label="More menu"
          >
            <Menu size={22} />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Slide-in menu drawer */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl flex flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-neutral-800">MoyaMoya</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="p-4 border-b border-neutral-200">
                <p className="text-sm font-medium text-neutral-800 truncate">{user.name}</p>
                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
              </div>
            )}

            {/* Links */}
            <nav className="flex-1 overflow-y-auto p-3">
              <ul className="space-y-1">
                {(isAdmin ? adminLinks : allLinks).map((link: any) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  const showBadge = link.showBadge && unreadCount > 0;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        )}
                      >
                        <link.icon size={20} className="shrink-0" />
                        <span className="flex-1">{link.label}</span>
                        {showBadge && (
                          <span className="bg-red-500 text-white text-[10px] rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-neutral-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-neutral-500 hover:text-danger hover:bg-neutral-100 transition-colors"
              >
                <LogOut size={20} className="shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
