'use client';

import { useState, useEffect } from 'react';
import { Users, Activity, MessageSquare, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Ucitavanje...</div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Ukupno korisnika',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-primary-500',
      bg: 'bg-primary-50',
    },
    {
      label: 'Aktivni ovaj tjedan',
      value: stats?.activeUsers7d || 0,
      icon: Activity,
      color: 'text-success',
      bg: 'bg-green-50',
    },
    {
      label: 'Ukupno objava',
      value: stats?.totalSOS || 0,
      icon: MessageSquare,
      color: 'text-info',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ukupno tema na forumu',
      value: stats?.totalSymptoms || 0,
      icon: TrendingUp,
      color: 'text-warning',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Analitika</h1>
        <p className="text-neutral-500">Pregled aktivnosti platforme</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-xs text-neutral-500">{card.label}</span>
            </div>
            <span className="text-2xl font-bold text-neutral-800">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Activity Summary */}
      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Pregled aktivnosti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50">
            <p className="text-sm text-neutral-500 mb-1">Novi korisnici ovaj tjedan</p>
            <p className="text-xl font-bold text-neutral-800">+{stats?.newThisWeek || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50">
            <p className="text-sm text-neutral-500 mb-1">Simptomi (30 dana)</p>
            <p className="text-xl font-bold text-neutral-800">{stats?.symptoms30d || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50">
            <p className="text-sm text-neutral-500 mb-1">Aktivni lijekovi</p>
            <p className="text-xl font-bold text-neutral-800">{stats?.activeMedications || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50">
            <p className="text-sm text-neutral-500 mb-1">BP mjerenja (30 dana)</p>
            <p className="text-xl font-bold text-neutral-800">{stats?.bpReadings30d || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
