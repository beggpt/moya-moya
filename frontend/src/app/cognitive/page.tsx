'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  Brain,
  Zap,
  Palette,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Save,
  Check,
} from 'lucide-react';

type TestType = 'REACTION_TIME' | 'DIGIT_SPAN' | 'STROOP';

type CognitiveTest = {
  id: string;
  testType: TestType | string;
  score: number;
  maxScore?: number | null;
  duration: number;
  timestamp: string;
};

const TEST_META: Record<TestType, { title: string; subtitle: string; icon: any; accent: string }> = {
  REACTION_TIME: {
    title: 'Reaction Time',
    subtitle: 'Attention & processing speed',
    icon: Zap,
    accent: 'bg-amber-100 text-amber-700',
  },
  DIGIT_SPAN: {
    title: 'Memory Recall',
    subtitle: 'Working memory (digit span)',
    icon: Brain,
    accent: 'bg-violet-100 text-violet-700',
  },
  STROOP: {
    title: 'Stroop Test',
    subtitle: 'Executive function & attention',
    icon: Palette,
    accent: 'bg-teal-100 text-teal-700',
  },
};

export default function CognitivePage() {
  const [history, setHistory] = useState<CognitiveTest[]>([]);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/cognitive');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const trendFor = (type: TestType) => {
    const of = history.filter((h) => h.testType === type).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    if (of.length < 2) return null;
    const last = of[of.length - 1].score;
    const prev = of[of.length - 2].score;
    const change = ((last - prev) / (prev || 1)) * 100;
    return { change, trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable' };
  };

  const closeAndRefresh = () => {
    setActiveTest(null);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Cognitive tests</h1>
        <p className="text-neutral-600 mt-1">Track your cognitive health over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['REACTION_TIME', 'DIGIT_SPAN', 'STROOP'] as TestType[]).map((type) => {
          const meta = TEST_META[type];
          const Icon = meta.icon;
          const trend = trendFor(type);
          return (
            <div key={type} className="card flex flex-col">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.accent} mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">{meta.title}</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-4">{meta.subtitle}</p>
              {trend && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  {trend.trend === 'improving' ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-4 h-4" /> Improving ({trend.change.toFixed(1)}%)
                    </span>
                  ) : trend.trend === 'declining' ? (
                    <span className="flex items-center gap-1 text-rose-600">
                      <TrendingDown className="w-4 h-4" /> Declining ({trend.change.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Minus className="w-4 h-4" /> Stable
                    </span>
                  )}
                </div>
              )}
              <button
                className="btn-primary mt-auto flex items-center justify-center gap-2"
                onClick={() => setActiveTest(type)}
              >
                <Play className="w-4 h-4" /> Start test
              </button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">History</h2>
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-neutral-500">No results yet. Try a test above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-neutral-200 text-neutral-600">
                  <th className="py-2 px-2">Test</th>
                  <th className="py-2 px-2">Score</th>
                  <th className="py-2 px-2">Duration</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => {
                  const same = history.filter((x) => x.testType === h.testType);
                  const idx = same.findIndex((x) => x.id === h.id);
                  const next = same[idx + 1];
                  let trendEl: any = <Minus className="w-4 h-4 text-neutral-400" />;
                  if (next) {
                    const change = ((h.score - next.score) / (next.score || 1)) * 100;
                    if (change > 5) trendEl = <TrendingUp className="w-4 h-4 text-emerald-500" />;
                    else if (change < -5) trendEl = <TrendingDown className="w-4 h-4 text-rose-500" />;
                  }
                  const meta =
                    (TEST_META as any)[h.testType] || {
                      title: h.testType,
                      accent: 'bg-neutral-100 text-neutral-700',
                    };
                  return (
                    <tr key={h.id || i} className="border-b border-neutral-100">
                      <td className="py-2 px-2">
                        <span className={`badge ${meta.accent}`}>{meta.title}</span>
                      </td>
                      <td className="py-2 px-2 font-medium">
                        {h.score}
                        {h.maxScore ? <span className="text-neutral-400"> / {h.maxScore}</span> : null}
                      </td>
                      <td className="py-2 px-2 text-neutral-600">{Math.round(h.duration)}s</td>
                      <td className="py-2 px-2 text-neutral-600">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-2">{trendEl}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTest === 'REACTION_TIME' && <ReactionTimeTest onClose={closeAndRefresh} />}
      {activeTest === 'DIGIT_SPAN' && <DigitSpanTest onClose={closeAndRefresh} />}
      {activeTest === 'STROOP' && <StroopTest onClose={closeAndRefresh} />}
    </div>
  );
}

function TestOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// -------------------- Reaction Time --------------------
function ReactionTimeTest({ onClose }: { onClose: () => void }) {
  const TOTAL = 5;
  const [state, setState] = useState<'idle' | 'waiting' | 'go' | 'early' | 'done'>('idle');
  const [times, setTimes] = useState<number[]>([]);
  const [trial, setTrial] = useState(0);
  const startRef = useRef<number>(0);
  const timerRef = useRef<any>(null);
  const testStartRef = useRef<number>(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const begin = () => {
    setTimes([]);
    setTrial(0);
    setState('waiting');
    testStartRef.current = Date.now();
    scheduleGo();
  };

  const scheduleGo = () => {
    const wait = 2000 + Math.random() * 4000;
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setState('go');
    }, wait);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      clearTimeout(timerRef.current);
      setState('early');
      return;
    }
    if (state === 'early') {
      setState('waiting');
      scheduleGo();
      return;
    }
    if (state === 'go') {
      const rt = performance.now() - startRef.current;
      const newTimes = [...times, rt];
      setTimes(newTimes);
      if (newTimes.length >= TOTAL) {
        setState('done');
      } else {
        setTrial((t) => t + 1);
        setState('waiting');
        scheduleGo();
      }
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const score = Math.round(Math.max(0, 1000 - avg) / 10);

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/cognitive', {
        testType: 'REACTION_TIME',
        score,
        maxScore: 100,
        duration: Math.round((Date.now() - testStartRef.current) / 1000),
        details: JSON.stringify({ trials: times.map((t) => Math.round(t)), avgMs: Math.round(avg) }),
      });
      setSaved(true);
      setTimeout(onClose, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TestOverlay title="Reaction Time Test" onClose={onClose}>
      {state === 'idle' && (
        <div className="text-center space-y-4">
          <Zap className="w-12 h-12 text-amber-500 mx-auto" />
          <p className="text-neutral-700">
            When the circle turns <span className="font-semibold text-emerald-600">green</span>, click
            it as fast as possible. 5 trials. Don&apos;t click early.
          </p>
          <button className="btn-primary" onClick={begin}>
            Start
          </button>
        </div>
      )}

      {(state === 'waiting' || state === 'go' || state === 'early') && (
        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-500">
            Trial {Math.min(trial + 1, TOTAL)} of {TOTAL}
          </p>
          <button
            onClick={handleClick}
            className={`w-full h-80 rounded-2xl flex items-center justify-center text-white text-2xl font-semibold transition-colors ${
              state === 'go'
                ? 'bg-emerald-500'
                : state === 'early'
                ? 'bg-rose-500'
                : 'bg-neutral-700'
            }`}
          >
            {state === 'waiting' && 'Wait for green...'}
            {state === 'go' && 'CLICK!'}
            {state === 'early' && 'Too early — click to retry'}
          </button>
        </div>
      )}

      {state === 'done' && (
        <div className="text-center space-y-4">
          <div className="py-6">
            <p className="text-sm text-neutral-500">Average reaction time</p>
            <p className="text-5xl font-bold text-teal-600 my-2">{Math.round(avg)} ms</p>
            <p className="text-neutral-600">
              Score: <span className="font-semibold">{score} / 100</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-neutral-500">
            {times.map((t, i) => (
              <span key={i} className="badge bg-neutral-100 text-neutral-700">
                {Math.round(t)} ms
              </span>
            ))}
          </div>
          <button
            className="btn-primary flex items-center justify-center gap-2 mx-auto"
            onClick={save}
            disabled={saving || saved}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save result'}
          </button>
        </div>
      )}
    </TestOverlay>
  );
}

// -------------------- Digit Span --------------------
function DigitSpanTest({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'show' | 'input' | 'done'>('idle');
  const [length, setLength] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [displayIdx, setDisplayIdx] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [bestLength, setBestLength] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const startRef = useRef(0);

  const genSeq = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10));

  const begin = (n: number) => {
    const seq = genSeq(n);
    setSequence(seq);
    setAnswer('');
    setDisplayIdx(-1);
    setPhase('show');
    if (!startRef.current) startRef.current = Date.now();

    let i = 0;
    const show = () => {
      if (i >= seq.length) {
        setDisplayIdx(-1);
        setPhase('input');
        return;
      }
      setDisplayIdx(i);
      setTimeout(() => {
        setDisplayIdx(-2); // gap
        i++;
        setTimeout(show, 500);
      }, 1000);
    };
    setTimeout(show, 600);
  };

  const submit = () => {
    const correct = answer.trim() === sequence.join('');
    if (correct) {
      setBestLength(length);
      const next = length + 1;
      setLength(next);
      if (next > 12) {
        setPhase('done');
      } else {
        begin(next);
      }
    } else {
      setPhase('done');
    }
  };

  const score = bestLength * 10;

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/cognitive', {
        testType: 'DIGIT_SPAN',
        score,
        maxScore: 120,
        duration: Math.round((Date.now() - (startRef.current || Date.now())) / 1000),
        details: JSON.stringify({ longest: bestLength }),
      });
      setSaved(true);
      setTimeout(onClose, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TestOverlay title="Memory Recall (Digit Span)" onClose={onClose}>
      {phase === 'idle' && (
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-violet-500 mx-auto" />
          <p className="text-neutral-700">
            Watch the digits appear one by one, then type them back in order. Sequences get longer
            each time. Starts at 3 digits.
          </p>
          <button className="btn-primary" onClick={() => begin(3)}>
            Start
          </button>
        </div>
      )}

      {phase === 'show' && (
        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-500">Sequence length: {length}</p>
          <div className="h-60 flex items-center justify-center">
            <span className="text-8xl font-bold text-teal-600">
              {displayIdx >= 0 ? sequence[displayIdx] : ''}
            </span>
          </div>
        </div>
      )}

      {phase === 'input' && (
        <div className="space-y-4">
          <p className="text-center text-neutral-600">Type the digits in order</p>
          <input
            autoFocus
            inputMode="numeric"
            className="input text-center text-3xl tracking-widest"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={length}
          />
          <button className="btn-primary w-full" onClick={submit}>
            Submit
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center space-y-4">
          <div className="py-6">
            <p className="text-sm text-neutral-500">Longest sequence recalled</p>
            <p className="text-5xl font-bold text-teal-600 my-2">{bestLength} digits</p>
            <p className="text-neutral-600">
              Score: <span className="font-semibold">{score} / 120</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">Healthy adults typically recall 7 ± 2 digits.</p>
          </div>
          <button
            className="btn-primary flex items-center justify-center gap-2 mx-auto"
            onClick={save}
            disabled={saving || saved || bestLength === 0}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save result'}
          </button>
        </div>
      )}
    </TestOverlay>
  );
}

// -------------------- Stroop --------------------
const STROOP_COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#10b981' },
  { name: 'YELLOW', hex: '#eab308' },
];

function StroopTest({ onClose }: { onClose: () => void }) {
  const TOTAL = 20;
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [current, setCurrent] = useState<{ word: string; ink: string; hex: string } | null>(null);
  const startRef = useRef(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const nextTrial = (t: number) => {
    const word = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    let ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    // 80% incongruent
    if (ink.name === word.name && Math.random() < 0.8) {
      ink = STROOP_COLORS[(STROOP_COLORS.indexOf(ink) + 1) % STROOP_COLORS.length];
    }
    setCurrent({ word: word.name, ink: ink.name, hex: ink.hex });
    setTrial(t);
  };

  const begin = () => {
    setCorrect(0);
    startRef.current = Date.now();
    setPhase('running');
    nextTrial(0);
  };

  const answer = (colorName: string) => {
    if (!current) return;
    if (colorName === current.ink) setCorrect((c) => c + 1);
    const next = trial + 1;
    if (next >= TOTAL) {
      setPhase('done');
    } else {
      nextTrial(next);
    }
  };

  const duration = Math.round((Date.now() - startRef.current) / 1000);
  const score = correct * 5;

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/cognitive', {
        testType: 'STROOP',
        score,
        maxScore: 100,
        duration,
        details: JSON.stringify({ correct, total: TOTAL }),
      });
      setSaved(true);
      setTimeout(onClose, 900);
    } finally {
      setSaving(false);
    }
  };

  return (
    <TestOverlay title="Stroop Test" onClose={onClose}>
      {phase === 'idle' && (
        <div className="text-center space-y-4">
          <Palette className="w-12 h-12 text-teal-500 mx-auto" />
          <p className="text-neutral-700">
            You&apos;ll see a color word written in a different color. Click the button matching the{' '}
            <span className="font-semibold">ink color</span>, not the word. 20 trials.
          </p>
          <button className="btn-primary" onClick={begin}>
            Start
          </button>
        </div>
      )}

      {phase === 'running' && current && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>
              Trial {trial + 1} / {TOTAL}
            </span>
            <span>Correct: {correct}</span>
          </div>
          <div className="h-40 flex items-center justify-center">
            <span className="text-6xl font-bold" style={{ color: current.hex }}>
              {current.word}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {STROOP_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => answer(c.name)}
                className="btn-secondary py-3 font-semibold"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center space-y-4">
          <div className="py-6">
            <p className="text-sm text-neutral-500">Correct answers</p>
            <p className="text-5xl font-bold text-teal-600 my-2">
              {correct} / {TOTAL}
            </p>
            <p className="text-neutral-600">
              Score: <span className="font-semibold">{score} / 100</span>
            </p>
            <p className="text-xs text-neutral-500 mt-2">Time: {duration}s</p>
          </div>
          <button
            className="btn-primary flex items-center justify-center gap-2 mx-auto"
            onClick={save}
            disabled={saving || saved}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save result'}
          </button>
        </div>
      )}
    </TestOverlay>
  );
}
