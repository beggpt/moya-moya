'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Plus, Filter, Mic, X } from 'lucide-react';
import api from '@/lib/api';
import { SymptomLog, SymptomType, SYMPTOM_LABELS, SYMPTOM_ICONS } from '@/types';
import Sidebar from '@/components/shared/Sidebar';
import SOSButton from '@/components/shared/SOSButton';
import AuthProvider from '@/components/shared/AuthProvider';

const SEVERITY_COLORS = [
  '', 'bg-green-100 text-green-800', 'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800', 'bg-yellow-100 text-yellow-800',
  'bg-orange-100 text-orange-800', 'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800', 'bg-red-100 text-red-800',
  'bg-red-200 text-red-900', 'bg-red-300 text-red-900',
];

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');

  // Form state
  const [formType, setFormType] = useState<SymptomType>('HEADACHE');
  const [formSeverity, setFormSeverity] = useState(5);
  const [formDuration, setFormDuration] = useState('');
  const [formTrigger, setFormTrigger] = useState('');
  const [formActivity, setFormActivity] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formEmergency, setFormEmergency] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSymptoms(); }, [page, filterType]);

  const loadSymptoms = async () => {
    try {
      const params: any = { page, limit: 20 };
      if (filterType) params.type = filterType;
      const { data } = await api.get('/symptoms', { params });
      setSymptoms(data.symptoms);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/symptoms', {
        type: formType,
        severity: formSeverity,
        durationMin: formDuration ? parseInt(formDuration) : null,
        trigger: formTrigger || null,
        activity: formActivity || null,
        notes: formNotes || null,
        wasEmergency: formEmergency,
      });
      setShowForm(false);
      resetForm();
      loadSymptoms();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormType('HEADACHE');
    setFormSeverity(5);
    setFormDuration('');
    setFormTrigger('');
    setFormActivity('');
    setFormNotes('');
    setFormEmergency(false);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-neutral-50">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Simptomi</h1>
                <p className="text-neutral-500">Ukupno {total} zapisa</p>
              </div>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="w-5 h-5 mr-2" /> Novi zapis
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Filter className="w-4 h-4 text-neutral-500" />
              <button
                onClick={() => { setFilterType(''); setPage(1); }}
                className={`badge ${!filterType ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-600'} cursor-pointer`}
              >
                Svi
              </button>
              {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setFilterType(key); setPage(1); }}
                  className={`badge ${filterType === key ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-600'} cursor-pointer`}
                >
                  {SYMPTOM_ICONS[key as SymptomType]} {label}
                </button>
              ))}
            </div>

            {/* Symptom list */}
            <div className="space-y-3">
              {loading ? (
                <p className="text-neutral-500">Učitavanje...</p>
              ) : symptoms.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-neutral-500">Nema zabilježenih simptoma</p>
                  <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                    <Plus className="w-5 h-5 mr-2" /> Zabilježi prvi simptom
                  </button>
                </div>
              ) : (
                symptoms.map((s) => (
                  <div key={s.id} className="card flex items-start gap-4">
                    <div className="text-2xl">{SYMPTOM_ICONS[s.type] || '📋'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-neutral-800">
                          {SYMPTOM_LABELS[s.type] || s.type}
                        </span>
                        <span className={`badge text-xs ${SEVERITY_COLORS[s.severity]}`}>
                          {s.severity}/10
                        </span>
                        {s.wasEmergency && <span className="badge-danger text-xs">Hitno</span>}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {format(new Date(s.timestamp), 'd.M.yyyy HH:mm', { locale: hr })}
                        {s.durationMin && ` · ${s.durationMin} min`}
                        {s.trigger && ` · Okidač: ${s.trigger}`}
                      </p>
                      {s.notes && <p className="text-sm text-neutral-600 mt-1">{s.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost"
                >
                  Prethodna
                </button>
                <span className="px-4 py-2 text-sm text-neutral-600">
                  Stranica {page} od {Math.ceil(total / 20)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 20)}
                  className="btn-ghost"
                >
                  Sljedeća
                </button>
              </div>
            )}

            {/* New Symptom Modal */}
            {showForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-neutral-900">Novi simptom</h2>
                    <button onClick={() => { setShowForm(false); resetForm(); }} className="p-2 hover:bg-neutral-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type */}
                    <div>
                      <label className="label">Tip simptoma</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(SYMPTOM_LABELS).map(([key, label]) => (
                          <button
                            key={key} type="button"
                            onClick={() => setFormType(key as SymptomType)}
                            className={`p-3 rounded-xl border text-center text-xs font-medium transition-all min-h-[56px] ${
                              formType === key
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                            }`}
                          >
                            <span className="text-lg block mb-1">{SYMPTOM_ICONS[key as SymptomType]}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="label">Ozbiljnost: {formSeverity}/10</label>
                      <input
                        type="range" min="1" max="10" value={formSeverity}
                        onChange={(e) => setFormSeverity(parseInt(e.target.value))}
                        className="w-full h-3 rounded-full appearance-none cursor-pointer accent-primary-500"
                      />
                      <div className="flex justify-between text-xs text-neutral-400 mt-1">
                        <span>Blago</span><span>Umjereno</span><span>Teško</span>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label htmlFor="duration" className="label">Trajanje (minuta)</label>
                      <input
                        id="duration" type="number" value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        className="input" placeholder="npr. 15"
                      />
                    </div>

                    {/* Trigger */}
                    <div>
                      <label htmlFor="trigger" className="label">Okidač</label>
                      <select
                        id="trigger" value={formTrigger}
                        onChange={(e) => setFormTrigger(e.target.value)}
                        className="input"
                      >
                        <option value="">Odaberi...</option>
                        <option value="dehidracija">Dehidracija</option>
                        <option value="stres">Stres</option>
                        <option value="vježba">Vježba</option>
                        <option value="umor">Umor</option>
                        <option value="vrućina">Vrućina</option>
                        <option value="hiperventilacija">Hiperventilacija</option>
                        <option value="plakanje">Plakanje</option>
                        <option value="nepoznato">Nepoznato</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="label">Bilješke</label>
                      <div className="relative">
                        <textarea
                          id="notes" value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          className="input min-h-[80px] pr-12" rows={3}
                          placeholder="Dodatne bilješke..."
                        />
                        <button
                          type="button"
                          className="absolute right-3 bottom-3 p-2 text-neutral-400 hover:text-primary-500 rounded-lg hover:bg-primary-50"
                          aria-label="Glasovni unos"
                          title="Glasovni unos"
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Emergency toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox" checked={formEmergency}
                        onChange={(e) => setFormEmergency(e.target.checked)}
                        className="w-5 h-5 rounded border-neutral-300 text-danger focus:ring-danger"
                      />
                      <span className="text-sm text-neutral-700">Označi kao hitan slučaj</span>
                    </label>

                    <button type="submit" disabled={saving} className="btn-primary w-full">
                      {saving ? 'Spremanje...' : 'Spremi simptom'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
        <SOSButton />
      </div>
    </AuthProvider>
  );
}
