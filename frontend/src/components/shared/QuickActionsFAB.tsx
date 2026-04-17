'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Activity, Heart, Dumbbell, PenSquare } from 'lucide-react';

interface Action {
  label: string;
  icon: React.ReactNode;
  href: string;
  bg: string;
  /** Target position relative to FAB center, in px */
  offset: { x: number; y: number };
}

const RADIUS = 100;

// 4 satellites arranged in a quarter-arc fanning up-and-left from the FAB
// Angles (CSS coord system — negative Y is up):
//   180° = left, 150° = up-left, 120° = up-up-left, 90° = up
const ACTIONS: Action[] = [
  {
    label: 'Log symptom',
    icon: <Activity size={22} />,
    href: '/symptoms',
    bg: 'bg-rose-500 hover:bg-rose-600',
    // 180° (left)
    offset: { x: -RADIUS, y: 0 },
  },
  {
    label: 'Log BP',
    icon: <Heart size={22} />,
    href: '/blood-pressure',
    bg: 'bg-red-500 hover:bg-red-600',
    // 150°
    offset: { x: -RADIUS * Math.cos(Math.PI / 6), y: -RADIUS * Math.sin(Math.PI / 6) },
  },
  {
    label: 'Log exercise',
    icon: <Dumbbell size={22} />,
    href: '/exercise',
    bg: 'bg-amber-500 hover:bg-amber-600',
    // 120°
    offset: { x: -RADIUS * Math.cos(Math.PI / 3), y: -RADIUS * Math.sin(Math.PI / 3) },
  },
  {
    label: 'New post',
    icon: <PenSquare size={22} />,
    href: '/dashboard?compose=1',
    bg: 'bg-primary-500 hover:bg-primary-600',
    // 90° (straight up)
    offset: { x: 0, y: -RADIUS },
  },
];

export default function QuickActionsFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleAction = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Backdrop — click anywhere to close */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/20 z-40 md:bg-black/10 animate-fade-in"
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}

      {/* FAB container — positioned above mobile bottom-nav */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 pb-[env(safe-area-inset-bottom)]">
        {/* Satellites */}
        <div className="absolute inset-0 pointer-events-none">
          {ACTIONS.map((action, i) => {
            const x = open ? Math.round(action.offset.x) : 0;
            const y = open ? Math.round(action.offset.y) : 0;
            return (
              <button
                key={action.href}
                onClick={() => handleAction(action.href)}
                aria-label={action.label}
                tabIndex={open ? 0 : -1}
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${open ? 1 : 0.3})`,
                  transitionDelay: open ? `${i * 40}ms` : `${(ACTIONS.length - i - 1) * 20}ms`,
                }}
                className={`
                  absolute top-0 left-0 w-14 h-14 rounded-full shadow-lg ${action.bg}
                  text-white flex items-center justify-center
                  transition-all duration-300 ease-out
                  ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                  group
                `}
              >
                {action.icon}
                {/* Label tooltip appears to the left of the satellite */}
                <span
                  className="
                    absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-neutral-900 text-white
                    text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100
                    transition-opacity pointer-events-none
                  "
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={open}
          className={`
            relative w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600
            text-white shadow-lg shadow-primary-300/40 flex items-center justify-center
            transition-all duration-200 active:scale-95
            ${open ? 'rotate-45' : ''}
          `}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
