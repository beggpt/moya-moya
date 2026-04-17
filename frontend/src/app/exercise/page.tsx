'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  X,
  Footprints,
  Waves,
  Bike,
  Flower2,
  Dumbbell,
  Leaf,
  Sparkles,
  Wind,
  Trees,
  Music,
  Armchair,
  Heart,
} from 'lucide-react';

type Safety = 'SAFE' | 'CAUTION' | 'AVOID';
type Intensity = 'LOW' | 'MODERATE' | 'HIGH';

type ExerciseDef = {
  key: string;
  name: string;
  safety: Safety;
  tip: string;
  icon: any;
};

const RECOMMENDED: ExerciseDef[] = [
  { key: 'walking', name: 'Walking', safety: 'SAFE', tip: '30 min daily. Low impact, improves circulation.', icon: Footprints },
  { key: 'yoga', name: 'Gentle Yoga (Hatha)', safety: 'SAFE', tip: 'Avoid inversions and breath retention (kumbhaka).', icon: Flower2 },
  { key: 'tai_chi', name: 'Tai Chi', safety: 'SAFE', tip: 'Gentle, balance-focused movement.', icon: Leaf },
  { key: 'swimming', name: 'Swimming', safety: 'SAFE', tip: 'Moderate pace. Do not hold your breath underwater.', icon: Waves },
  { key: 'cycling', name: 'Stationary Cycling', safety: 'SAFE', tip: 'Low resistance, steady pace.', icon: Bike },
  { key: 'stretching', name: 'Stretching Routine', safety: 'SAFE', tip: 'Daily flexibility work — breathe normally.', icon: Sparkles },
  { key: 'resistance_bands', name: 'Resistance Bands (light)', safety: 'SAFE', tip: 'Light resistance, no breath-holding.', icon: Activity },
  { key: 'pilates', name: 'Light Pilates', safety: 'CAUTION', tip: 'Avoid inversions and intense core holds.', icon: Dumbbell },
  { key: 'elliptical', name: 'Elliptical Trainer', safety: 'SAFE', tip: 'Low intensity, keep heart rate moderate.', icon: Activity },
  { key: 'aqua_aerobics', name: 'Aqua Aerobics', safety: 'SAFE', tip: 'Water supports joints and cools the body.', icon: Waves },
  { key: 'nordic_walking', name: 'Nordic Walking', safety: 'SAFE', tip: 'Poles engage upper body, gentle cardio.', icon: Footprints },
  { key: 'gardening', name: 'Gardening', safety: 'SAFE', tip: 'Active and calming. Avoid straining lifts.', icon: Trees },
  { key: 'dancing', name: 'Dancing (low intensity)', safety: 'SAFE', tip: 'Keep tempo easy, breathe normally.', icon: Music },
  { key: 'chair_yoga', name: 'Chair Yoga', safety: 'SAFE', tip: 'Great for reduced mobility — no inversions.', icon: Armchair },
];

const AVOID_LIST = [
  { name: 'HIIT / sprinting', reason: 'Hyperventilation can trigger ischemia/TIA.' },
  { name: 'Heavy weight lifting', reason: 'Valsalva maneuver raises intracranial pressure.' },
  { name: 'Breath-holding exercises (free diving, Wim Hof)', reason: 'Reduces cerebral oxygenation.' },
  { name: 'Scuba diving', reason: 'Pressure changes + breath-holding; strictly contraindicated.' },
  { name: 'High-altitude trekking', reason: 'Reduced oxygen strains cerebral circulation.' },
  { name: 'Contact sports', reason: 'Head trauma risk with compromised vasculature.' },
  { name: 'Hot yoga', reason: 'Dehydration + hyperventilation risk.' },
];

const SAFETY_BADGE: Record<Safety, string> = {
  SAFE: 'bg-emerald-100 text-emerald-700',
  CAUTION: 'bg-amber-100 text-amber-700',
  AVOID: 'bg-rose-100 text-rose-700',
};

type Log = {
  id: string;
  activity: string;
  intensity: Intensity;
  safety: Safety;
  durationMin: number;
  hydrated: boolean;
  symptoms?: string | null;
  notes?: string | null;
  timestamp: string;
};

export default function ExercisePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ExerciseDef | null>(null);

  const load = async () => {
    try {
      const res = await api.get('/exercise', { params: { limit: 10 } });
      const data = res.data?.logs ?? res.data ?? [];
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    try {
      await api.delete(`/exercise/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Exercise</h1>
        <p className="text-neutral-600 mt-1">Safe movement tailored for moyamoya patients</p>
      </div>

      <div className="card bg-teal-50 border border-teal-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-teal-900">
            <p className="font-semibold mb-1">Exercise considerations for moyamoya</p>
            <p>
              Avoid high-intensity effort, hyperventilation, breath-holding, and dehydration — these
              can trigger cerebral ischemia. Stick with steady, moderate activity, breathe normally,
              drink water, and stop immediately if you feel dizzy, weak, or notice neurological
              symptoms.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recommended safe exercises</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECOMMENDED.map((ex) => {
            const Icon = ex.icon;
            return (
              <div key={ex.key} className="card flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`badge ${SAFETY_BADGE[ex.safety]}`}>
                    {ex.safety === 'SAFE' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {ex.safety === 'CAUTION' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                    {ex.safety}
                  </span>
                </div>
                <h3 className="font-semibold text-neutral-900">{ex.name}</h3>
                <p className="text-sm text-neutral-600 mt-1 mb-4 flex-1">{ex.tip}</p>
                {ex.safety !== 'AVOID' && (
                  <button className="btn-secondary w-full" onClick={() => setModal(ex)}>
                    Log session
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Exercises to avoid</h2>
        <div className="card">
          <ul className="divide-y divide-neutral-200">
            {AVOID_LIST.map((a, i) => (
              <li key={i} className="py-3 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-900">{a.name}</p>
                  <p className="text-sm text-neutral-600">{a.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recent sessions</h2>
          <Heart className="w-5 h-5 text-teal-500" />
        </div>
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-neutral-500">No sessions logged yet.</p>
        ) : (
          <div className="divide-y divide-neutral-200">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-neutral-900 capitalize">
                      {log.activity.replace(/_/g, ' ')}
                    </p>
                    <span className={`badge ${SAFETY_BADGE[log.safety] || SAFETY_BADGE.SAFE}`}>
                      {log.safety}
                    </span>
                    <span className="badge bg-neutral-100 text-neutral-700">{log.intensity}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    {log.durationMin} min · {new Date(log.timestamp).toLocaleDateString()}{' '}
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {log.symptoms ? ` · symptoms: ${log.symptoms}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => remove(log.id)}
                  className="btn-ghost p-2"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <LogSessionModal
          exercise={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function LogSessionModal({
  exercise,
  onClose,
  onSaved,
}: {
  exercise: ExerciseDef;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [durationMin, setDurationMin] = useState(30);
  const [intensity, setIntensity] = useState<Intensity>('LOW');
  const [hydrated, setHydrated] = useState(true);
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.post('/exercise', {
        activity: exercise.key,
        intensity,
        safety: exercise.safety,
        durationMin,
        hydrated,
        symptoms: symptoms.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Log session</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Activity</label>
            <input className="input" value={exercise.name} disabled />
          </div>

          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              max={480}
              className="input"
              value={durationMin}
              onChange={(e) => setDurationMin(Math.max(1, Number(e.target.value) || 0))}
            />
          </div>

          <div>
            <label className="label">Intensity</label>
            <div className="flex gap-2">
              {(['LOW', 'MODERATE'] as Intensity[]).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntensity(i)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    intensity === i
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hydrated}
              onChange={(e) => setHydrated(e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <span className="text-sm text-neutral-700">I stayed hydrated during this session</span>
          </label>

          <div>
            <label className="label">Symptoms during (optional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. slight headache, dizziness, none"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Saving...' : 'Save session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
