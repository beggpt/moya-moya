'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  Activity, Pill, Heart, Brain, Calendar, TrendingDown, TrendingUp, Minus,
  Plus, Droplets
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { SYMPTOM_LABELS, SYMPTOM_ICONS, SymptomType } from '@/types';

const quickSymptoms: { type: SymptomType; label: string; icon: string }[] = [
  { type: 'HEADACHE', label: 'Glavobolja', icon: '🤕' },
  { type: 'TIA', label: 'TIA', icon: '⚡' },
  { type: 'DIZZINESS', label: 'Vrtoglavica', icon: '😵' },
  { type: 'WEAKNESS', label: 'Slabost', icon: '💪' },
  { type: 'NUMBNESS', label: 'Utrnulost', icon: '🖐️' },
  { type: 'VISION_CHANGE', label: 'Vid', icon: '👁️' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [bpLatest, setBpLatest] = useState<any>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [quickLogging, setQuickLogging] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [sympRes, medRes, bpRes, aptRes] = await Promise.all([
        api.get('/symptoms/stats/summary?days=7').catch(() => ({ data: {} })),
        api.get('/medications?active=true').catch(() => ({ data: [] })),
        api.get('/bp/stats/summary?days=7').catch(() => ({ data: {} })),
        api.get('/appointments?upcoming=true').catch(() => ({ data: [] })),
      ]);
      setStats(sympRes.data);
      setMeds(medRes.data);
      setBpLatest(bpRes.data?.latest);
      setNextAppointment(aptRes.data?.[0]);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (type: SymptomType) => {
    setQuickLogging(type);
    try {
      await api.post('/symptoms/quick', { type, severity: 5 });
      await loadDashboard();
    } catch (error) {
      console.error('Quick log error:', error);
    } finally {
      setQuickLogging(null);
    }
  };

  const handleMedTaken = async (medId: string) => {
    try {
      await api.post(`/medications/${medId}/taken`);
      await loadDashboard();
    } catch (error) {
      console.error('Med taken error:', error);
    }
  };

  const today = format(new Date(), 'EEEE, d. MMMM', { locale: hr });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">
          Dobar dan, {user?.name?.split(' ')[0] || 'korisniče'} 👋
        </h1>
        <p className="text-neutral-500 capitalize">{today}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <Activity className="w-6 h-6 text-primary-500 mb-2" />
          <span className="text-2xl font-bold text-neutral-800">{stats?.total || 0}</span>
          <span className="text-xs text-neutral-500">Simptoma (7 dana)</span>
        </div>
        <div className="stat-card">
          <Pill className="w-6 h-6 text-primary-500 mb-2" />
          <span className="text-2xl font-bold text-neutral-800">{meds.length}</span>
          <span className="text-xs text-neutral-500">Aktivnih lijekova</span>
        </div>
        <div className="stat-card">
          <Heart className="w-6 h-6 text-primary-500 mb-2" />
          <span className="text-2xl font-bold text-neutral-800">
            {bpLatest ? `${bpLatest.systolic}/${bpLatest.diastolic}` : '-'}
          </span>
          <span className="text-xs text-neutral-500">Zadnji BP (mmHg)</span>
        </div>
        <div className="stat-card">
          <Calendar className="w-6 h-6 text-primary-500 mb-2" />
          <span className="text-sm font-bold text-neutral-800">
            {nextAppointment ? format(new Date(nextAppointment.date), 'd.M.', { locale: hr }) : 'Nema'}
          </span>
          <span className="text-xs text-neutral-500">Sljedeći termin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Symptom Log */}
        <div className="card">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-500" />
            Brzi zapis simptoma
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {quickSymptoms.map((s) => (
              <button
                key={s.type}
                onClick={() => handleQuickLog(s.type)}
                disabled={quickLogging === s.type}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all min-h-[80px]"
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xs font-medium text-neutral-700">
                  {quickLogging === s.type ? '✓' : s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Medication Reminders */}
        <div className="card">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary-500" />
            Lijekovi danas
          </h2>
          {meds.length === 0 ? (
            <p className="text-neutral-500 text-sm">Nema aktivnih lijekova</p>
          ) : (
            <div className="space-y-3">
              {meds.map((med) => (
                <div key={med.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
                  <div>
                    <p className="font-medium text-neutral-800">{med.name}</p>
                    <p className="text-xs text-neutral-500">{med.dosage}{med.unit} - {med.frequency}</p>
                  </div>
                  <button
                    onClick={() => handleMedTaken(med.id)}
                    className="px-4 py-2 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 transition-colors min-h-[36px]"
                  >
                    Uzeto ✓
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Symptom Trend */}
        <div className="card">
          <h2 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Tjedni pregled
          </h2>
          {stats?.byType?.length > 0 ? (
            <div className="space-y-2">
              {stats.byType.map((item: any) => (
                <div key={item.type} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span>{SYMPTOM_ICONS[item.type as SymptomType] || '📋'}</span>
                    <span className="text-sm text-neutral-700">
                      {SYMPTOM_LABELS[item.type as SymptomType] || item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-800">{item._count}x</span>
                    <span className="text-xs text-neutral-500">
                      (prosj. {Math.round(item._avg?.severity || 0)}/10)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">Nema zabilježenih simptoma ovaj tjedan</p>
          )}
        </div>

        {/* Hydration Reminder */}
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-600" />
            Podsjetnik na hidrataciju
          </h2>
          <p className="text-sm text-blue-800">
            Dehidracija je čest okidač za TIA kod moyamoya pacijenata. Pijte najmanje 2 litre vode dnevno.
            Povećajte unos za vrijeme vrućina ili vježbe.
          </p>
        </div>
      </div>
    </div>
  );
}
