'use client';

import { useState, useEffect } from 'react';
import { Pill, Plus, Check, SkipForward, Clock, X } from 'lucide-react';
import api from '@/lib/api';

interface Medication {
  id: string;
  name: string;
  dosage: number;
  unit: string;
  frequency: string;
  timesOfDay: string[];
  active: boolean;
  takenToday?: boolean;
  skippedToday?: boolean;
}

const FREQUENCIES = [
  { value: 'once_daily', label: 'Jednom dnevno' },
  { value: 'twice_daily', label: 'Dva puta dnevno' },
  { value: 'three_daily', label: 'Tri puta dnevno' },
  { value: 'as_needed', label: 'Po potrebi' },
];

const TIMES_OF_DAY = [
  { value: 'morning', label: 'Jutro' },
  { value: 'afternoon', label: 'Popodne' },
  { value: 'evening', label: 'Vecer' },
  { value: 'night', label: 'Noc' },
];

const UNITS = ['mg', 'ml', 'g', 'mcg', 'IU', 'tableta'];

const timeLabel = (t: string) =>
  TIMES_OF_DAY.find((td) => td.value === t)?.label || t;

const freqLabel = (f: string) =>
  FREQUENCIES.find((fr) => fr.value === f)?.label || f;

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formUnit, setFormUnit] = useState('mg');
  const [formFrequency, setFormFrequency] = useState('once_daily');
  const [formTimes, setFormTimes] = useState<string[]>(['morning']);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const { data } = await api.get('/medications');
      setMedications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaken = async (medId: string) => {
    setActionLoading(medId + '-taken');
    try {
      await api.post(`/medications/${medId}/taken`);
      await loadMedications();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkip = async (medId: string) => {
    setActionLoading(medId + '-skip');
    try {
      await api.post(`/medications/${medId}/skip`);
      await loadMedications();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleTime = (time: string) => {
    setFormTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDosage) return;
    setSaving(true);
    try {
      await api.post('/medications', {
        name: formName,
        dosage: parseFloat(formDosage),
        unit: formUnit,
        frequency: formFrequency,
        timesOfDay: formTimes,
      });
      setShowModal(false);
      resetForm();
      loadMedications();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDosage('');
    setFormUnit('mg');
    setFormFrequency('once_daily');
    setFormTimes(['morning']);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Ucitavanje...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Lijekovi</h1>
          <p className="text-neutral-500">{medications.length} aktivnih lijekova</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Dodaj lijek
        </button>
      </div>

      {/* Medications List */}
      {medications.length === 0 ? (
        <div className="card text-center py-12">
          <Pill className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">Nemate dodanih lijekova</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" /> Dodaj prvi lijek
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {medications.map((med) => (
            <div key={med.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Pill className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800">{med.name}</h3>
                    <p className="text-sm text-neutral-500">
                      {med.dosage} {med.unit} &middot; {freqLabel(med.frequency)}
                    </p>
                    {med.timesOfDay && med.timesOfDay.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <div className="flex gap-1">
                          {med.timesOfDay.map((t) => (
                            <span key={t} className="badge bg-neutral-100 text-neutral-600 text-xs">
                              {timeLabel(t)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {med.takenToday ? (
                    <span className="badge bg-green-100 text-green-700 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" /> Uzeto
                    </span>
                  ) : med.skippedToday ? (
                    <span className="badge bg-neutral-100 text-neutral-500 text-sm flex items-center gap-1">
                      <SkipForward className="w-4 h-4" /> Preskoceno
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleTaken(med.id)}
                        disabled={actionLoading === med.id + '-taken'}
                        className="px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1 min-h-[36px]"
                      >
                        <Check className="w-4 h-4" />
                        {actionLoading === med.id + '-taken' ? '...' : 'Uzeto'}
                      </button>
                      <button
                        onClick={() => handleSkip(med.id)}
                        disabled={actionLoading === med.id + '-skip'}
                        className="btn-ghost text-sm flex items-center gap-1"
                      >
                        <SkipForward className="w-4 h-4" />
                        {actionLoading === med.id + '-skip' ? '...' : 'Preskoci'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Dodaj lijek</h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="med-name" className="label">Naziv lijeka</label>
                <input
                  id="med-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input"
                  placeholder="npr. Aspirin"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="med-dosage" className="label">Doza</label>
                  <input
                    id="med-dosage"
                    type="number"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    className="input"
                    placeholder="npr. 100"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="med-unit" className="label">Jedinica</label>
                  <select
                    id="med-unit"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="input"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="med-freq" className="label">Ucestalost</label>
                <select
                  id="med-freq"
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="input"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Vrijeme uzimanja</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIMES_OF_DAY.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleTime(t.value)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        formTimes.includes(t.value)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Spremanje...' : 'Spremi lijek'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
