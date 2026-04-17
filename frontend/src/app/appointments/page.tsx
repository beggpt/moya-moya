'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Trash2, X, MapPin, Phone, Check, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import api from '@/lib/api';

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  location?: string;
  phone?: string;
  notes?: string;
  questions?: string;
  completed?: boolean;
}

const SPECIALTIES = [
  'Neurologist check-up',
  'Neurosurgeon consultation',
  'Cerebral angiography (DSA)',
  'MRI / MR angiography (MRA)',
  'CT angiography',
  'EEG',
  'Neuropsychological evaluation',
  'Physical therapy',
  'Ophthalmology',
  'Cardiology',
  'Pre-operative consultation',
  'Post-surgery follow-up',
  'Stroke clinic',
  'Other',
];

const DEFAULT_QUESTIONS = `- Current Suzuki stage?
- Any new TIA symptoms?
- Medication adjustments needed?
- When is the next imaging follow-up?
- Are there activity restrictions I should follow?`;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const { data } = await api.get('/appointments');
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSpecialty(SPECIALTIES[0]);
    setDoctorName('');
    setDate('');
    setLocation('');
    setPhone('');
    setNotes('');
    setQuestions(DEFAULT_QUESTIONS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !date) return;
    setSaving(true);
    try {
      await api.post('/appointments', {
        doctorName,
        specialty,
        date: new Date(date).toISOString(),
        location: location || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        questions: questions || undefined,
      });
      setShowModal(false);
      resetForm();
      await loadAppointments();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/appointments/${id}`, { completed: true });
      await loadAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      await loadAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of appointments) {
      const t = new Date(a.date).getTime();
      if (a.completed || t < now) pa.push(a);
      else up.push(a);
    }
    up.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    pa.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return { upcoming: up, past: pa };
  }, [appointments]);

  const list = tab === 'upcoming' ? upcoming : past;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Appointments</h1>
          <p className="text-neutral-500">{upcoming.length} upcoming &middot; {past.length} past</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" /> New appointment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            tab === 'upcoming'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            tab === 'past'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </p>
          {tab === 'upcoming' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-5 h-5 mr-2" /> Add appointment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge bg-primary-50 text-primary-700">{a.specialty}</span>
                    {a.completed && (
                      <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-900 font-semibold">
                    <Stethoscope className="w-4 h-4 text-neutral-400" />
                    {a.doctorName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    {format(new Date(a.date), "EEEE, d MMMM yyyy 'at' HH:mm", { locale: enUS })}
                  </div>
                  {a.location && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      {a.location}
                    </div>
                  )}
                  {a.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                      <Phone className="w-4 h-4 text-neutral-400" />
                      {a.phone}
                    </div>
                  )}
                  {a.notes && (
                    <div className="mt-3 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 whitespace-pre-wrap">
                      {a.notes}
                    </div>
                  )}
                  {a.questions && (
                    <div className="mt-2 text-sm text-neutral-600 bg-primary-50 rounded-lg p-3 whitespace-pre-wrap">
                      <div className="font-semibold text-primary-700 mb-1">Questions to ask</div>
                      {a.questions}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {!a.completed && (
                    <button onClick={() => handleComplete(a.id)} className="btn-secondary text-sm">
                      <Check className="w-4 h-4 mr-1" /> Mark as done
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">New appointment</h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Specialty</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input">
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Doctor name</label>
                <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="input" placeholder="e.g. Dr. Smith" required />
              </div>
              <div>
                <label className="label">Date & time</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="input" placeholder="Hospital, clinic, address" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="Contact number" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} placeholder="Additional notes" />
              </div>
              <div>
                <label className="label">Questions to ask</label>
                <textarea value={questions} onChange={(e) => setQuestions(e.target.value)} className="input" rows={6} />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving...' : 'Save appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
