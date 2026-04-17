'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import {
  ArrowLeft, Download, Loader2, User as UserIcon, Stethoscope,
  Activity, Pill, Heart, Brain, Calendar, FileText, Save,
  AlertTriangle, Shield
} from 'lucide-react';
import api from '@/lib/api';

type Tab =
  | 'overview'
  | 'medical'
  | 'symptoms'
  | 'medications'
  | 'bp'
  | 'cognitive'
  | 'appointments'
  | 'notes';

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { key: 'overview', label: 'Overview', icon: UserIcon },
  { key: 'medical', label: 'Medical Info', icon: Stethoscope },
  { key: 'symptoms', label: 'Symptoms', icon: Activity },
  { key: 'medications', label: 'Medications', icon: Pill },
  { key: 'bp', label: 'BP Readings', icon: Heart },
  { key: 'cognitive', label: 'Cognitive', icon: Brain },
  { key: 'appointments', label: 'Appointments', icon: Calendar },
  { key: 'notes', label: 'Admin Notes', icon: FileText },
];

const AVATAR_COLORS = [
  'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-emerald-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-orange-500',
];

function pickColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SIDE_LABELS: Record<string, string> = {
  LEFT: 'Left', RIGHT: 'Right', BILATERAL: 'Bilateral',
};

function fmtDate(d: string | null | undefined, fmt = 'MMM d, yyyy') {
  if (!d) return '-';
  try {
    return format(new Date(d), fmt, { locale: enUS });
  } catch {
    return '-';
  }
}

function fmtDateTime(d: string | null | undefined) {
  return fmtDate(d, 'MMM d, yyyy h:mm a');
}

export default function AdminUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Admin notes
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Role
  const [role, setRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setUser(data);
      setNotes(data?.profile?.adminNotes || '');
      setRole(data?.role || '');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await api.put(`/admin/users/${userId}/notes`, { notes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleChangeRole = async (newRole: string) => {
    setRole(newRole);
    setSavingRole(true);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRole(false);
    }
  };

  const exportUrl = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return `${base}/admin/users/${userId}/export`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl">
        <button onClick={() => router.push('/admin/users')} className="btn-ghost mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to users
        </button>
        <div className="card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  const profile = user.profile || {};
  const symptoms = user.symptoms || [];
  const medications = user.medications || [];
  const bpReadings = user.bpReadings || [];
  const cognitiveTests = user.cognitiveTests || [];
  const appointments = user.appointments || [];
  const exerciseLogs = user.exerciseLogs || [];
  const sosEvents = user.sosEvents || [];
  const caregivers = user.caregivers || [];
  const caregiverFor = user.caregiverFor || [];

  return (
    <div className="max-w-6xl">
      <Link href="/admin/users" className="btn-ghost mb-6 inline-flex">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to users
      </Link>

      {/* Header card */}
      <div className="card mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          {user.image ? (
            <img src={user.image} alt={user.name || ''} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${pickColor(user.name || user.email || '')}`}>
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl font-bold text-neutral-900">{user.name || '-'}</h1>
            <p className="text-sm text-neutral-500">{user.email}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <p className="text-xs text-neutral-500">Role</p>
                <select
                  value={role}
                  onChange={(e) => handleChangeRole(e.target.value)}
                  disabled={savingRole}
                  className="input mt-1 text-sm py-1.5"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="CAREGIVER">Caregiver</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Last login</p>
                <p className="font-medium text-neutral-800 mt-1">{fmtDateTime(user.lastLoginAt)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Created</p>
                <p className="font-medium text-neutral-800 mt-1">{fmtDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Verified</p>
                <p className="font-medium text-neutral-800 mt-1">{user.emailVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          <a
            href={exportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-neutral-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Activity} label="Symptoms logged" value={symptoms.length} color="text-red-500" />
          <StatCard icon={Pill} label="Medications" value={medications.length} color="text-blue-500" />
          <StatCard icon={Heart} label="BP readings" value={bpReadings.length} color="text-rose-500" />
          <StatCard icon={Brain} label="Cognitive tests" value={cognitiveTests.length} color="text-purple-500" />
          <StatCard icon={Calendar} label="Appointments" value={appointments.length} color="text-teal-500" />
          <StatCard icon={Activity} label="Exercise logs" value={exerciseLogs.length} color="text-emerald-500" />
          <StatCard icon={AlertTriangle} label="SOS events" value={sosEvents.length} color="text-danger" />
          <StatCard icon={Shield} label="Caregivers" value={caregivers.length + caregiverFor.length} color="text-indigo-500" />
        </div>
      )}

      {activeTab === 'medical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Personal</h3>
            <Field label="Date of birth" value={fmtDate(profile.dateOfBirth)} />
            <Field label="Gender" value={profile.gender || '-'} />
            <Field label="Height" value={profile.height ? `${profile.height} cm` : '-'} />
            <Field label="Weight" value={profile.weight ? `${profile.weight} kg` : '-'} />
            <Field label="Blood type" value={profile.bloodType || '-'} />
            <Field label="Allergies" value={profile.allergies || '-'} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Diagnosis</h3>
            <Field label="Type" value={profile.moyamoyaType === 'DISEASE' ? 'Moyamoya disease' : profile.moyamoyaType === 'SYNDROME' ? 'Moyamoya syndrome' : '-'} />
            <Field label="Suzuki stage" value={profile.suzukiStage ? `Stage ${profile.suzukiStage}` : '-'} />
            <Field label="Affected side" value={SIDE_LABELS[profile.affectedSide] || '-'} />
            <Field label="Date of diagnosis" value={fmtDate(profile.diagnosisDate)} />
            <Field label="Underlying condition" value={profile.underlyingCondition || '-'} />
            <Field label="Other conditions" value={profile.otherConditions || '-'} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Surgery</h3>
            <Field label="Had surgery?" value={profile.hadSurgery ? 'Yes' : 'No'} />
            {profile.hadSurgery && (
              <>
                <Field label="Surgery type" value={profile.surgeryType || '-'} />
                <Field label="Surgery date" value={fmtDate(profile.surgeryDate)} />
                <Field label="Notes" value={profile.surgeryNotes || '-'} />
              </>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Care team &amp; emergency</h3>
            <Field label="Hospital" value={profile.hospitalName || '-'} />
            <Field label="Neurologist" value={profile.neurologistName || '-'} />
            <Field label="Neurologist phone" value={profile.neurologistPhone || '-'} />
            <Field label="Emergency contact" value={profile.emergencyContact || '-'} />
            <Field label="Emergency phone" value={profile.emergencyPhone || '-'} />
            <Field label="Relationship" value={profile.emergencyRelation || '-'} />
          </div>
        </div>
      )}

      {activeTab === 'symptoms' && (
        <DataTable
          empty="No symptoms logged"
          columns={['Time', 'Type', 'Severity', 'Duration', 'Trigger', 'Emergency', 'Notes']}
          rows={symptoms.map((s: any) => [
            fmtDateTime(s.timestamp),
            s.type,
            `${s.severity}/10`,
            s.durationMin ? `${s.durationMin} min` : '-',
            s.trigger || '-',
            s.wasEmergency ? 'Yes' : 'No',
            s.notes || '-',
          ])}
        />
      )}

      {activeTab === 'medications' && (
        <DataTable
          empty="No medications"
          columns={['Name', 'Dose', 'Frequency', 'Times of day', 'Start', 'End', 'Active']}
          rows={medications.map((m: any) => [
            m.name,
            `${m.dosage} ${m.unit || ''}`,
            m.frequency || '-',
            Array.isArray(m.timesOfDay) ? m.timesOfDay.join(', ') : '-',
            fmtDate(m.startDate),
            fmtDate(m.endDate),
            m.active ? 'Yes' : 'No',
          ])}
        />
      )}

      {activeTab === 'bp' && (
        <DataTable
          empty="No BP readings"
          columns={['Time', 'Systolic', 'Diastolic', 'Heart rate', 'Position', 'Notes']}
          rows={bpReadings.map((b: any) => [
            fmtDateTime(b.timestamp),
            b.systolic,
            b.diastolic,
            b.heartRate || '-',
            b.position || '-',
            b.notes || '-',
          ])}
        />
      )}

      {activeTab === 'cognitive' && (
        <DataTable
          empty="No cognitive tests"
          columns={['Time', 'Test type', 'Score', 'Max score', 'Duration']}
          rows={cognitiveTests.map((c: any) => [
            fmtDateTime(c.timestamp),
            c.testType,
            c.score,
            c.maxScore ?? '-',
            c.duration ? `${c.duration}s` : '-',
          ])}
        />
      )}

      {activeTab === 'appointments' && (
        <DataTable
          empty="No appointments"
          columns={['Date', 'Doctor', 'Specialty', 'Location', 'Completed', 'Notes']}
          rows={appointments.map((a: any) => [
            fmtDateTime(a.date),
            a.doctorName,
            a.specialty || '-',
            a.location || '-',
            a.completed ? 'Yes' : 'No',
            a.notes || '-',
          ])}
        />
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <h3 className="font-semibold text-neutral-900 mb-2">Admin notes</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Internal notes visible only to admins. Use for flagging issues, treatment observations, or follow-up reminders.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[200px]"
            rows={8}
            placeholder="Write notes about this patient..."
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="btn-primary"
            >
              {savingNotes ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save</>
              )}
            </button>
            {notesSaved && <span className="text-sm text-success">Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <span className="text-2xl font-bold text-neutral-800">{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-neutral-100 last:border-0 gap-4">
      <span className="text-sm text-neutral-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-neutral-800 text-right">{value}</span>
    </div>
  );
}

function DataTable({
  columns, rows, empty,
}: { columns: string[]; rows: (string | number | React.ReactNode)[][]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-neutral-500">{empty}</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {columns.map((c) => (
                <th key={c} className="text-left text-xs font-medium text-neutral-500 p-3 whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="p-3 text-sm text-neutral-700 whitespace-nowrap max-w-xs truncate">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
