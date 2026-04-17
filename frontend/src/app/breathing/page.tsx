'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  Wind,
  Moon,
  Activity,
  AlertCircle,
  Pause,
  Play,
  Square,
  Check,
  X,
  Box as BoxIcon,
  Sparkles,
} from 'lucide-react';

type Technique = 'BOX' | 'FOUR_SEVEN_EIGHT' | 'COHERENT';
type Phase = 'inhale' | 'hold' | 'exhale';

type PhaseStep = { phase: Phase; sec: number };

type TechniqueDef = {
  key: Technique;
  name: string;
  shortPattern: string;
  description: string;
  durations: number[]; // minutes
  defaultDuration: number;
  pattern: PhaseStep[];
  icon: any;
  accent: string; // tailwind color class suffix for gradient
};

const TECHNIQUES: TechniqueDef[] = [
  {
    key: 'BOX',
    name: 'Box Breathing (4-4-4-4)',
    shortPattern: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s',
    description:
      'Balanced, calming. Great for daily practice and mild anxiety.',
    durations: [2, 5, 10],
    defaultDuration: 5,
    pattern: [
      { phase: 'inhale', sec: 4 },
      { phase: 'hold', sec: 4 },
      { phase: 'exhale', sec: 4 },
      { phase: 'hold', sec: 4 },
    ],
    icon: BoxIcon,
    accent: 'teal',
  },
  {
    key: 'FOUR_SEVEN_EIGHT',
    name: '4-7-8 Relaxation',
    shortPattern: 'Inhale 4s → Hold 7s → Exhale 8s',
    description:
      'Deep relaxation, especially for sleep or acute anxiety. Longer exhale calms the nervous system.',
    durations: [2, 5, 10],
    defaultDuration: 5,
    pattern: [
      { phase: 'inhale', sec: 4 },
      { phase: 'hold', sec: 7 },
      { phase: 'exhale', sec: 8 },
    ],
    icon: Moon,
    accent: 'indigo',
  },
  {
    key: 'COHERENT',
    name: 'Coherent Breathing (6 BPM)',
    shortPattern: 'Inhale 5s → Exhale 5s (no holding)',
    description:
      'Steady, rhythmic breathing. Optimizes heart rate variability. Research-backed for stress reduction.',
    durations: [5, 10, 15],
    defaultDuration: 10,
    pattern: [
      { phase: 'inhale', sec: 5 },
      { phase: 'exhale', sec: 5 },
    ],
    icon: Activity,
    accent: 'cyan',
  },
];

function phaseLabel(p: Phase): string {
  if (p === 'inhale') return 'Breathe in';
  if (p === 'exhale') return 'Breathe out';
  return 'Hold';
}

function phasePillClass(p: Phase): string {
  if (p === 'inhale') return 'bg-teal-100 text-teal-700';
  if (p === 'exhale') return 'bg-sky-100 text-sky-700';
  return 'bg-neutral-100 text-neutral-700';
}

function phasePillLabel(step: PhaseStep): string {
  const name =
    step.phase === 'inhale' ? 'Inhale' : step.phase === 'exhale' ? 'Exhale' : 'Hold';
  return `${name} ${step.sec}s`;
}

type Stats = {
  count: number;
  totalMinutes: number;
  byTechnique: Partial<Record<Technique, number>>;
};

type Session = {
  technique: TechniqueDef;
  durationSec: number;
};

export default function BreathingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/breathing/stats', { params: { days: 30 } });
      setStats(res.data ?? null);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const startSession = (tech: TechniqueDef, minutes: number) => {
    setSession({ technique: tech, durationSec: minutes * 60 });
  };

  const closeSession = () => {
    setSession(null);
    loadStats();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Breathing Exercises</h1>
        <p className="text-neutral-600 mt-1">
          Safe, slow breathing techniques for moyamoya — reduces anxiety and helps prevent
          hyperventilation-triggered episodes.
        </p>
      </div>

      {/* Panic mode callout */}
      <div className="card border-2 border-rose-300 bg-rose-50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-rose-900">
                Feeling panicked or hyperventilating?
              </p>
              <p className="text-sm text-rose-800 mt-0.5">
                Start a guided 5-minute 4-7-8 session now. Slow, long exhales will calm you
                down.
              </p>
            </div>
          </div>
          <button
            className="btn-primary bg-rose-600 hover:bg-rose-700 border-rose-600 whitespace-nowrap"
            onClick={() => startSession(TECHNIQUES[1], 5)}
          >
            <Wind className="w-4 h-4 inline mr-2" />
            Start calming breathing now
          </button>
        </div>
      </div>

      {/* Safety warning */}
      <div className="card bg-amber-50 border border-amber-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            These techniques use slow breathing without breath-holding beyond gentle pauses.
            Avoid hyperventilation, rapid breathing, and prolonged breath retention which can
            trigger ischemic symptoms.
          </p>
        </div>
      </div>

      {/* Technique cards */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Choose a technique</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TECHNIQUES.map((t) => (
            <TechniqueCard key={t.key} tech={t} onStart={startSession} />
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && stats.count > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900">Last 30 days</h2>
            <Sparkles className="w-5 h-5 text-teal-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Sessions" value={String(stats.count)} />
            <StatBox label="Total minutes" value={String(stats.totalMinutes)} />
            {TECHNIQUES.map((t) => (
              <StatBox
                key={t.key}
                label={t.key === 'FOUR_SEVEN_EIGHT' ? '4-7-8' : t.key === 'BOX' ? 'Box' : 'Coherent'}
                value={String(stats.byTechnique?.[t.key] ?? 0)}
                sub="sessions"
              />
            ))}
          </div>
        </div>
      )}

      {session && (
        <ActiveSession
          technique={session.technique}
          durationSec={session.durationSec}
          onClose={closeSession}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-teal-50 border border-teal-100 p-4">
      <p className="text-xs uppercase tracking-wide text-teal-700 font-medium">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function TechniqueCard({
  tech,
  onStart,
}: {
  tech: TechniqueDef;
  onStart: (t: TechniqueDef, minutes: number) => void;
}) {
  const [minutes, setMinutes] = useState<number>(tech.defaultDuration);
  const Icon = tech.icon;
  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <h3 className="font-semibold text-neutral-900">{tech.name}</h3>
      <p className="text-sm text-neutral-500 mt-0.5">{tech.shortPattern}</p>
      <p className="text-sm text-neutral-600 mt-3">{tech.description}</p>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {tech.pattern.map((step, i) => (
          <span key={i} className={`badge ${phasePillClass(step.phase)}`}>
            {phasePillLabel(step)}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-neutral-700 uppercase tracking-wide">
          Duration
        </label>
        <div className="flex gap-2 mt-1.5">
          {tech.durations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setMinutes(d)}
              className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                minutes === d
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary w-full mt-4"
        onClick={() => onStart(tech, minutes)}
      >
        <Play className="w-4 h-4 inline mr-2" />
        Start
      </button>
    </div>
  );
}

/* --------------------------- Active session UI --------------------------- */

function ActiveSession({
  technique,
  durationSec,
  onClose,
}: {
  technique: TechniqueDef;
  durationSec: number;
  onClose: () => void;
}) {
  const pattern = technique.pattern;
  const [stepIndex, setStepIndex] = useState(0);
  const [phaseElapsedMs, setPhaseElapsedMs] = useState(0);
  const [totalElapsedMs, setTotalElapsedMs] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Detect reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Animation / timing loop
  useEffect(() => {
    if (paused || finished) {
      lastTickRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const tick = (now: number) => {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;

      setPhaseElapsedMs((prev) => {
        const currentStep = pattern[stepIndex];
        const stepMs = currentStep.sec * 1000;
        const next = prev + dt;
        if (next >= stepMs) {
          const overflow = next - stepMs;
          // advance step
          const nextIndex = (stepIndex + 1) % pattern.length;
          setStepIndex(nextIndex);
          if (nextIndex === 0) setCycles((c) => c + 1);
          // set overflow as phase elapsed of next
          // Use microtask to update after stepIndex set
          queueMicrotask(() => setPhaseElapsedMs(overflow));
          return overflow;
        }
        return next;
      });
      setTotalElapsedMs((prev) => {
        const next = prev + dt;
        if (next >= durationSec * 1000) {
          setFinished(true);
          return durationSec * 1000;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, [paused, finished, stepIndex, pattern, durationSec]);

  const currentStep = pattern[stepIndex];
  const phaseRemainingMs = Math.max(0, currentStep.sec * 1000 - phaseElapsedMs);
  const phaseRemainingSec = Math.ceil(phaseRemainingMs / 1000);

  const totalElapsedSec = Math.floor(totalElapsedMs / 1000);

  // Determine circle scale based on current phase.
  // We compute a target scale for current phase; CSS transition handles easing.
  const scale = useMemo(() => {
    if (reducedMotion) return 1;
    if (currentStep.phase === 'inhale') return 1.5;
    if (currentStep.phase === 'exhale') return 0.8;
    // hold — keep scale of previous phase (inhale -> large, exhale -> small)
    const prev = pattern[(stepIndex - 1 + pattern.length) % pattern.length];
    if (prev.phase === 'inhale') return 1.5;
    if (prev.phase === 'exhale') return 0.8;
    return 1.15;
  }, [currentStep.phase, stepIndex, pattern, reducedMotion]);

  const opacity = reducedMotion
    ? currentStep.phase === 'inhale'
      ? 1
      : currentStep.phase === 'exhale'
        ? 0.6
        : 0.85
    : 1;

  // Transition duration matches current phase's duration so the animation
  // takes the full phase length.
  const transitionStyle = reducedMotion
    ? `opacity ${currentStep.sec}s ease-in-out`
    : `transform ${currentStep.sec}s ease-in-out, opacity ${currentStep.sec}s ease-in-out`;

  const handleEndEarly = () => {
    setFinished(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.post('/breathing', {
        technique: technique.key,
        durationSec: totalElapsedSec,
        cyclesCount: cycles,
      });
      setSaved(true);
    } catch (e: any) {
      setSaveError(e?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Summary view when finished
  if (finished) {
    const minutes = Math.max(1, Math.round(totalElapsedSec / 60));
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-teal-900 to-teal-700">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Great job!</h2>
          <p className="text-neutral-600 mt-2">
            You completed <span className="font-semibold text-neutral-900">{cycles}</span>{' '}
            {cycles === 1 ? 'cycle' : 'cycles'} in{' '}
            <span className="font-semibold text-neutral-900">
              {minutes} {minutes === 1 ? 'minute' : 'minutes'}
            </span>
            .
          </p>
          <p className="text-sm text-neutral-500 mt-1">{technique.name}</p>

          {saveError && <p className="text-sm text-rose-600 mt-4">{saveError}</p>}

          <div className="flex gap-2 mt-6">
            {!saved ? (
              <button
                className="btn-primary flex-1"
                onClick={handleSave}
                disabled={saving || totalElapsedSec < 10}
                title={totalElapsedSec < 10 ? 'Session too short to save' : undefined}
              >
                {saving ? 'Saving...' : 'Save session'}
              </button>
            ) : (
              <div className="flex-1 py-2 text-center text-sm text-teal-700 bg-teal-50 rounded-lg border border-teal-200">
                <Check className="w-4 h-4 inline mr-1" />
                Session saved
              </div>
            )}
            <button className="btn-ghost flex-1" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-teal-900 to-teal-700 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-200">Technique</p>
          <p className="font-semibold">{technique.name}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p
          className="text-3xl sm:text-4xl font-light tracking-wide mb-8 transition-opacity duration-500"
          aria-live="polite"
        >
          {paused ? 'Paused' : phaseLabel(currentStep.phase)}
        </p>

        {/* Breathing circle */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 280, height: 280 }}
        >
          {/* Outer rings */}
          <div
            className="absolute inset-0 rounded-full border border-white/10"
            style={{
              transform: `scale(${scale})`,
              opacity: opacity * 0.4,
              transition: transitionStyle,
            }}
          />
          <div
            className="absolute inset-6 rounded-full border border-white/20"
            style={{
              transform: `scale(${scale})`,
              opacity: opacity * 0.6,
              transition: transitionStyle,
            }}
          />
          {/* Main circle */}
          <div
            className="absolute inset-10 rounded-full bg-gradient-to-br from-teal-300/80 to-teal-500/80 shadow-2xl backdrop-blur-sm flex items-center justify-center"
            style={{
              transform: `scale(${scale})`,
              opacity,
              transition: transitionStyle,
            }}
          >
            <div className="text-center">
              <p className="text-6xl font-light tabular-nums">{phaseRemainingSec}</p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-teal-100 text-sm">
          {fmtTime(totalElapsedSec)} / {fmtTime(durationSec)} ·{' '}
          <span className="font-medium">{cycles}</span>{' '}
          {cycles === 1 ? 'cycle' : 'cycles'}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-xs h-1 bg-white/15 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-teal-200"
            style={{
              width: `${Math.min(100, (totalElapsedMs / (durationSec * 1000)) * 100)}%`,
              transition: 'width 200ms linear',
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-8">
        <button
          onClick={() => setPaused((p) => !p)}
          className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 font-medium"
        >
          {paused ? (
            <>
              <Play className="w-5 h-5" /> Resume
            </>
          ) : (
            <>
              <Pause className="w-5 h-5" /> Pause
            </>
          )}
        </button>
        <button
          onClick={handleEndEarly}
          className="px-5 py-3 rounded-full bg-white text-teal-800 hover:bg-teal-50 transition-colors flex items-center gap-2 font-medium"
        >
          <Square className="w-5 h-5" /> End session
        </button>
      </div>
    </div>
  );
}
