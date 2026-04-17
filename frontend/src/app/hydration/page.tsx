'use client';

import { useState, useEffect, useMemo } from 'react';
import { Droplet, Plus, Minus, Trash2, Target, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  Cell,
} from 'recharts';
import api from '@/lib/api';

interface HydrationLog {
  id: string;
  amountMl: number;
  timestamp: string;
}

interface TodayData {
  totalMl: number;
  goalMl: number;
  percentage: number;
  logs: HydrationLog[];
}

interface StatsPoint {
  date: string;
  ml: number;
}

const QUICK_AMOUNTS = [
  { label: 'Glass', ml: 200 },
  { label: 'Small bottle', ml: 330 },
  { label: 'Bottle', ml: 500 },
];

function formatNumber(n: number) {
  return n.toLocaleString('en-US');
}

export default function HydrationPage() {
  const [today, setToday] = useState<TodayData | null>(null);
  const [stats, setStats] = useState<StatsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pulse, setPulse] = useState(false);

  const [showCustom, setShowCustom] = useState(false);
  const [customMl, setCustomMl] = useState('');

  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        api.get('/hydration/today'),
        api.get('/hydration/stats', { params: { days: 7 } }),
      ]);
      setToday(t.data);
      setStats(s.data.series || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function logAmount(amountMl: number) {
    if (!amountMl || amountMl <= 0) return;
    setSaving(true);
    setPulse(true);
    setTimeout(() => setPulse(false), 500);

    // optimistic
    const optimisticId = `tmp-${Date.now()}`;
    const optimisticLog: HydrationLog = {
      id: optimisticId,
      amountMl,
      timestamp: new Date().toISOString(),
    };
    setToday((prev) =>
      prev
        ? {
            ...prev,
            totalMl: prev.totalMl + amountMl,
            percentage: prev.goalMl > 0 ? Math.round(((prev.totalMl + amountMl) / prev.goalMl) * 100) : 0,
            logs: [optimisticLog, ...prev.logs],
          }
        : prev
    );

    try {
      await api.post('/hydration', { amountMl });
      await loadAll();
    } catch (e) {
      console.error(e);
      await loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function deleteLog(id: string) {
    const prev = today;
    setToday((p) =>
      p
        ? {
            ...p,
            logs: p.logs.filter((l) => l.id !== id),
            totalMl: p.totalMl - (p.logs.find((l) => l.id === id)?.amountMl || 0),
            percentage:
              p.goalMl > 0
                ? Math.round(
                    ((p.totalMl - (p.logs.find((l) => l.id === id)?.amountMl || 0)) / p.goalMl) * 100
                  )
                : 0,
          }
        : p
    );
    try {
      await api.delete(`/hydration/${id}`);
      await loadAll();
    } catch (e) {
      console.error(e);
      setToday(prev);
    }
  }

  async function saveGoal() {
    const n = parseInt(goalInput, 10);
    if (!n || n < 500 || n > 10000) return;
    try {
      await api.put('/hydration/goal', { goalMl: n });
      setEditingGoal(false);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  }

  async function submitCustom() {
    const n = parseInt(customMl, 10);
    if (!n || n <= 0) return;
    await logAmount(n);
    setCustomMl('');
    setShowCustom(false);
  }

  const totalMl = today?.totalMl || 0;
  const goalMl = today?.goalMl || 2500;
  const percentage = today ? Math.min(999, today.percentage) : 0;
  const reached = percentage >= 100;

  // Ring geometry
  const size = 240;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, percentage);
  const dashOffset = circumference - (clamped / 100) * circumference;

  const ringColor = reached ? '#16a34a' : '#14b8a6'; // green-600 : teal-500

  const chartData = useMemo(() => {
    return stats.map((p) => {
      let label = p.date;
      try {
        label = format(parseISO(p.date), 'EEE');
      } catch {}
      return { ...p, label, met: p.ml >= goalMl };
    });
  }, [stats, goalMl]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Droplet className="text-teal-500" size={26} />
          Hydration
        </h1>
        <p className="text-sm text-gray-600">
          Dehydration is a known trigger for ischemic events in moyamoya. Aim to hit your daily goal.
        </p>
      </header>

      {/* Progress ring */}
      <div className="card flex flex-col items-center py-6">
        <div
          className="relative"
          style={{ width: size, height: size, maxWidth: '90vw' }}
        >
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity ${
              pulse ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <Droplet
              className={reached ? 'text-green-600' : 'text-teal-500'}
              size={28}
            />
            <div className="text-2xl font-bold mt-1">
              {formatNumber(totalMl)} <span className="text-gray-400 font-normal">/</span>{' '}
              {formatNumber(goalMl)}
              <span className="text-sm text-gray-500 ml-1">ml</span>
            </div>
            <div className={`text-lg font-semibold ${reached ? 'text-green-600' : 'text-teal-600'}`}>
              {percentage}%
            </div>
            {reached && (
              <div className="text-xs font-medium text-green-700 mt-1">Goal reached! 💧</div>
            )}
          </div>
        </div>

        {/* Quick-log buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mt-6">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q.ml}
              onClick={() => logAmount(q.ml)}
              disabled={saving}
              className="btn-primary flex flex-col items-center py-3"
            >
              <div className="flex items-center gap-1 font-semibold">
                <Plus size={16} />
                {q.ml}ml
              </div>
              <div className="text-xs opacity-90">{q.label}</div>
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            disabled={saving}
            className="btn-ghost flex flex-col items-center py-3 border border-gray-200"
          >
            <div className="flex items-center gap-1 font-semibold">
              <Plus size={16} />
              Custom…
            </div>
            <div className="text-xs opacity-70">Any amount</div>
          </button>
        </div>
      </div>

      {/* 7-day chart */}
      <div className="card">
        <h2 className="font-semibold mb-3">Last 7 days</h2>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="ml" width={60} />
              <Tooltip
                formatter={(v: any) => [`${formatNumber(v as number)} ml`, 'Intake']}
                labelFormatter={(l) => l}
              />
              <ReferenceLine
                y={goalMl}
                stroke="#14b8a6"
                strokeDasharray="4 4"
                label={{ value: 'Goal', fontSize: 11, fill: '#0f766e', position: 'right' }}
              />
              <Bar dataKey="ml" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.met ? '#16a34a' : '#14b8a6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's log */}
      <div className="card">
        <h2 className="font-semibold mb-3">Today&apos;s log</h2>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : !today || today.logs.length === 0 ? (
          <div className="text-sm text-gray-500 py-6 text-center">
            No entries yet today. Tap a quick-log button above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {today.logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Droplet size={16} />
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(log.amountMl)} ml</div>
                    <div className="text-xs text-gray-500">
                      {format(parseISO(log.timestamp), 'HH:mm')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  aria-label="Delete entry"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Goal settings */}
      <div className="card">
        <button
          onClick={() => setGoalOpen((o) => !o)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Target className="text-teal-500" size={18} />
            <span className="font-semibold">Daily goal</span>
            <span className="badge bg-teal-50 text-teal-700">{formatNumber(goalMl)} ml</span>
          </div>
          {goalOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {goalOpen && (
          <div className="mt-4 space-y-3">
            {editingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={500}
                  max={10000}
                  step={50}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g. 2500"
                />
                <span className="text-sm text-gray-500">ml</span>
                <button onClick={saveGoal} className="btn-primary">
                  Save
                </button>
                <button
                  onClick={() => setEditingGoal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Current: <span className="font-medium">{formatNumber(goalMl)} ml</span>
                </span>
                <button
                  onClick={() => {
                    setGoalInput(String(goalMl));
                    setEditingGoal(true);
                  }}
                  className="btn-ghost"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Default is weight × 30 ml. Adjust for climate, activity level, and your doctor&apos;s
              recommendation.
            </p>
          </div>
        )}
      </div>

      {/* Custom modal */}
      {showCustom && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowCustom(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Droplet className="text-teal-500" size={18} /> Custom amount
              </h3>
              <button
                onClick={() => setShowCustom(false)}
                className="p-1 text-gray-500"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="label">Amount (ml)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCustomMl((v) => String(Math.max(0, (parseInt(v, 10) || 0) - 50)))
                  }
                  className="btn-ghost p-2"
                  aria-label="Decrease"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={1}
                  step={10}
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  className="input flex-1 text-center"
                  placeholder="250"
                  autoFocus
                />
                <button
                  onClick={() =>
                    setCustomMl((v) => String((parseInt(v, 10) || 0) + 50))
                  }
                  className="btn-ghost p-2"
                  aria-label="Increase"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCustom(false)} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={submitCustom}
                disabled={!customMl || saving}
                className="btn-primary flex-1"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
