'use client';

import { useState, useEffect, useMemo } from 'react';
import { Activity, Plus, Trash2, X, Sunrise, Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Reading {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate?: number;
  position?: 'LYING' | 'SITTING' | 'STANDING';
  timestamp: string;
  notes?: string;
}

interface Summary {
  avgSystolic: number | null;
  avgDiastolic: number | null;
  latest: Reading | null;
  count: number;
}

const POSITIONS: Array<{ value: 'LYING' | 'SITTING' | 'STANDING'; label: string }> = [
  { value: 'SITTING', label: 'Sitting' },
  { value: 'LYING', label: 'Lying' },
  { value: 'STANDING', label: 'Standing' },
];

export default function BloodPressurePage() {
  const { user } = useAuthStore();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalKind, setModalKind] = useState<'morning' | 'evening' | 'generic'>('generic');
  const [saving, setSaving] = useState(false);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [position, setPosition] = useState<'LYING' | 'SITTING' | 'STANDING'>('SITTING');
  const [notes, setNotes] = useState('');

  const targetSystolic = (user?.profile as any)?.targetSystolic as number | undefined;
  const targetDiastolic = (user?.profile as any)?.targetDiastolic as number | undefined;

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [r, s] = await Promise.all([
        api.get('/bp'),
        api.get('/bp/stats/summary', { params: { days: 7 } }),
      ]);
      setReadings(Array.isArray(r.data) ? r.data : []);
      setSummary(s.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (kind: 'morning' | 'evening' | 'generic') => {
    setModalKind(kind);
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setPosition('SITTING');
    setNotes('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (!sys || !dia) return;
    setSaving(true);
    try {
      const label = modalKind === 'morning' ? 'Morning reading' : modalKind === 'evening' ? 'Evening reading' : '';
      const finalNotes = [label, notes].filter(Boolean).join(' — ');
      await api.post('/bp', {
        systolic: sys,
        diastolic: dia,
        heartRate: heartRate ? parseInt(heartRate) : undefined,
        position,
        notes: finalNotes || undefined,
      });
      setShowModal(false);
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reading?')) return;
    try {
      await api.delete(`/bp/${id}`);
      await loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = useMemo(() => {
    const cutoff = subDays(new Date(), 14);
    const filtered = readings
      .filter((r) => isAfter(new Date(r.timestamp), cutoff))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return filtered.map((r) => ({
      date: format(new Date(r.timestamp), 'd.M.'),
      systolic: r.systolic,
      diastolic: r.diastolic,
    }));
  }, [readings]);

  const trend = useMemo(() => {
    if (readings.length < 2 || !summary?.avgSystolic) return null;
    const sorted = [...readings].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latest = sorted[0];
    if (!latest) return null;
    const diff = latest.systolic - summary.avgSystolic;
    if (Math.abs(diff) < 2) return 'flat';
    return diff > 0 ? 'up' : 'down';
  }, [readings, summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Blood Pressure</h1>
          <p className="text-neutral-500">{readings.length} total readings</p>
        </div>
      </div>

      {/* Quick add */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button onClick={() => openModal('morning')} className="card flex items-center gap-4 hover:shadow-md transition-shadow text-left">
          <div className="p-3 rounded-xl bg-primary-50">
            <Sunrise className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <div className="font-semibold text-neutral-900">Morning reading</div>
            <div className="text-sm text-neutral-500">Log your morning blood pressure</div>
          </div>
        </button>
        <button onClick={() => openModal('evening')} className="card flex items-center gap-4 hover:shadow-md transition-shadow text-left">
          <div className="p-3 rounded-xl bg-primary-50">
            <Moon className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <div className="font-semibold text-neutral-900">Evening reading</div>
            <div className="text-sm text-neutral-500">Log your evening blood pressure</div>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-900">Last 7 days</h2>
          <span className="text-sm text-neutral-500">{summary?.count ?? 0} readings</span>
        </div>
        {summary && summary.avgSystolic && summary.avgDiastolic ? (
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-neutral-500 mb-1">Average</div>
              <div className="text-3xl font-bold text-neutral-900">
                {Math.round(summary.avgSystolic)}<span className="text-neutral-400">/</span>{Math.round(summary.avgDiastolic)}
                <span className="text-base text-neutral-500 font-normal ml-1">mmHg</span>
              </div>
            </div>
            {trend && (
              <div className="flex items-center gap-2">
                {trend === 'up' && <TrendingUp className="w-5 h-5 text-red-500" />}
                {trend === 'down' && <TrendingDown className="w-5 h-5 text-green-500" />}
                {trend === 'flat' && <Minus className="w-5 h-5 text-neutral-400" />}
                <span className="text-sm text-neutral-600">
                  {trend === 'up' ? 'Latest above average' : trend === 'down' ? 'Latest below average' : 'Stable'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">No readings in the last 7 days</p>
        )}
      </div>

      {/* Chart */}
      <div className="card mb-8">
        <h2 className="font-semibold text-neutral-900 mb-4">Last 14 days</h2>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-neutral-300 mb-3" />
            <p className="text-neutral-500 text-sm">No data for the last 14 days</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[40, 200]} />
                <Tooltip />
                {targetSystolic && (
                  <ReferenceLine y={targetSystolic} stroke="#14b8a6" strokeDasharray="4 4" label={{ value: 'Target SYS', fontSize: 10, fill: '#14b8a6' }} />
                )}
                {targetDiastolic && (
                  <ReferenceLine y={targetDiastolic} stroke="#14b8a6" strokeDasharray="4 4" label={{ value: 'Target DIA', fontSize: 10, fill: '#14b8a6' }} />
                )}
                <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent readings */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Recent readings</h2>
        <button onClick={() => openModal('generic')} className="btn-ghost text-sm">
          <Plus className="w-4 h-4 mr-1" /> Add reading
        </button>
      </div>
      {readings.length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No readings yet</p>
          <button onClick={() => openModal('generic')} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" /> Add first reading
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...readings]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((r) => {
              const isHigh = r.systolic >= 140 || r.diastolic >= 90;
              return (
                <div key={r.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isHigh ? 'bg-red-50' : 'bg-green-50'}`}>
                      <Activity className={`w-5 h-5 ${isHigh ? 'text-red-500' : 'text-green-500'}`} />
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${isHigh ? 'text-red-600' : 'text-green-600'}`}>
                        {r.systolic}/{r.diastolic}
                        <span className="text-sm text-neutral-500 font-normal ml-2">mmHg</span>
                        {r.heartRate && (
                          <span className="text-sm text-neutral-600 font-normal ml-3">HR {r.heartRate} bpm</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {format(new Date(r.timestamp), 'd.M.yyyy HH:mm')}
                        {r.position && <span className="ml-2">&middot; {r.position}</span>}
                      </div>
                      {r.notes && <div className="text-xs text-neutral-500 mt-1">{r.notes}</div>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">
                {modalKind === 'morning' ? 'Morning reading' : modalKind === 'evening' ? 'Evening reading' : 'New reading'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Systolic</label>
                  <input type="number" value={systolic} onChange={(e) => setSystolic(e.target.value)} className="input" placeholder="120" required min={40} max={260} />
                </div>
                <div>
                  <label className="label">Diastolic</label>
                  <input type="number" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} className="input" placeholder="80" required min={30} max={180} />
                </div>
              </div>
              <div>
                <label className="label">Heart rate (optional)</label>
                <input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="input" placeholder="bpm" min={30} max={220} />
              </div>
              <div>
                <label className="label">Position</label>
                <select value={position} onChange={(e) => setPosition(e.target.value as any)} className="input">
                  {POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} placeholder="Optional notes" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save reading'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
