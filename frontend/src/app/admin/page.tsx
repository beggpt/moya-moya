'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, AlertTriangle, TrendingUp, Heart, Pill } from 'lucide-react';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-neutral-500">Učitavanje...</div>;

  const cards = [
    { label: 'Ukupno pacijenata', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary-500' },
    { label: 'Novi ovaj tjedan', value: `+${stats?.newUsersWeek || 0}`, icon: TrendingUp, color: 'text-success' },
    { label: 'Aktivni (7d)', value: stats?.activePatients || 0, icon: Activity, color: 'text-info' },
    { label: 'SOS eventi (30d)', value: stats?.emergencyEvents || 0, icon: AlertTriangle, color: 'text-danger' },
    { label: 'Simptomi (30d)', value: stats?.symptomsMonth || 0, icon: Activity, color: 'text-warning' },
    { label: 'Aktivni lijekovi', value: stats?.totalMeds || 0, icon: Pill, color: 'text-primary-600' },
    { label: 'BP mjerenja (30d)', value: stats?.totalBP || 0, icon: Heart, color: 'text-danger' },
    { label: 'Ukupno simptoma', value: stats?.totalSymptoms || 0, icon: Activity, color: 'text-neutral-600' },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-neutral-500">Pregled sustava MoyaMoya Companion</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-3 mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-neutral-500">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-neutral-800">{card.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
