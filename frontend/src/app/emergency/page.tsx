'use client';

import { useEffect, useState } from 'react';
import { Printer, Link2, Download, AlertTriangle, Phone, Pill, Stethoscope, User as UserIcon, Heart } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface PatientProfile {
  dateOfBirth?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
  bloodType?: string | null;
  diagnosisDate?: string | null;
  moyamoyaType?: 'DISEASE' | 'SYNDROME' | null;
  suzukiStage?: number | null;
  affectedSide?: 'LEFT' | 'RIGHT' | 'BILATERAL' | null;
  hadSurgery?: boolean | null;
  surgeryType?: string | null;
  surgeryDate?: string | null;
  surgeryDateLeft?: string | null;
  surgeryDateRight?: string | null;
  allergies?: string | null;
  otherConditions?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  hospitalName?: string | null;
  neurologistName?: string | null;
  neurologistPhone?: string | null;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  unit?: string;
  frequency: string;
  active?: boolean;
  endDate?: string | null;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return '—';
  }
}

function sideLabel(s?: string | null) {
  if (s === 'LEFT') return 'Left';
  if (s === 'RIGHT') return 'Right';
  if (s === 'BILATERAL') return 'Bilateral';
  return '—';
}

export default function EmergencyCardPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [publicToken, setPublicToken] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get('/patient/profile'),
          api.get('/medications', { params: { active: true } }),
        ]);
        setProfile(pRes.data);
        const medData = Array.isArray(mRes.data) ? mRes.data : mRes.data?.medications || [];
        setMeds(medData.filter((m: Medication) => m.active !== false));
        setPublicToken(user?.id || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handlePrint = () => window.print();

  const handleCopyLink = async () => {
    const url = publicToken
      ? `${window.location.origin}/emergency/${publicToken}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      alert(url);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/reports/emergency-card', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'emergency-card.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="text-neutral-500">Loading…</div>;
  }

  const surgeryDates = () => {
    if (!profile?.hadSurgery) return '—';
    if (profile.affectedSide === 'BILATERAL') {
      const L = profile.surgeryDateLeft ? `Left: ${formatDate(profile.surgeryDateLeft)}` : '';
      const R = profile.surgeryDateRight ? `Right: ${formatDate(profile.surgeryDateRight)}` : '';
      return [L, R].filter(Boolean).join(' · ') || '—';
    }
    return formatDate(profile.surgeryDate);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top header + actions */}
      <div className="no-print mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Emergency Medical Card</h1>
          <p className="text-neutral-500 mt-1">Show this to emergency responders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handlePrint} className="btn-primary">
            <Printer size={18} className="mr-2" /> Print
          </button>
          <button onClick={handleCopyLink} className="btn-secondary">
            <Link2 size={18} className="mr-2" /> {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button onClick={handleDownload} disabled={downloading} className="btn-ghost">
            <Download size={18} className="mr-2" /> {downloading ? 'Downloading…' : 'Download as PDF'}
          </button>
        </div>
      </div>

      {/* The card */}
      <div className="bg-white rounded-2xl border-4 border-red-600 p-8 shadow-lg print:shadow-none print:border-4 print:border-red-600">
        {/* Name + title */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-neutral-200">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white">
            <Heart size={32} />
          </div>
          <div className="flex-1">
            <p className="text-sm uppercase tracking-wide text-neutral-500 font-semibold">Medical Emergency Card</p>
            <h2 className="text-4xl font-bold text-neutral-900 leading-tight">{user?.name || '—'}</h2>
          </div>
        </div>

        {/* Big red banner */}
        <div className="mt-6 bg-red-600 text-white rounded-xl px-6 py-5 flex items-center gap-4">
          <AlertTriangle size={40} className="shrink-0" />
          <div>
            <p className="text-2xl font-extrabold uppercase leading-tight">Moyamoya Disease</p>
            <p className="text-lg opacity-95">Cerebrovascular condition</p>
          </div>
        </div>

        {/* Diagnosis + surgery grid */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <section>
            <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <Stethoscope size={22} className="text-teal-600" /> Diagnosis
            </h3>
            <dl className="space-y-2 text-xl">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500 font-medium">Type</dt>
                <dd className="font-semibold text-neutral-900">
                  {profile?.moyamoyaType === 'SYNDROME' ? 'Syndrome' : profile?.moyamoyaType === 'DISEASE' ? 'Disease' : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500 font-medium">Suzuki stage</dt>
                <dd className="font-semibold text-neutral-900">{profile?.suzukiStage ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500 font-medium">Affected side</dt>
                <dd className="font-semibold text-neutral-900">{sideLabel(profile?.affectedSide)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500 font-medium">Diagnosed</dt>
                <dd className="font-semibold text-neutral-900">{formatDate(profile?.diagnosisDate)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <UserIcon size={22} className="text-teal-600" /> Surgery
            </h3>
            <dl className="space-y-2 text-xl">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500 font-medium">Had surgery</dt>
                <dd className="font-semibold text-neutral-900">{profile?.hadSurgery ? 'Yes' : 'No'}</dd>
              </div>
              {profile?.hadSurgery && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 font-medium">Type</dt>
                    <dd className="font-semibold text-neutral-900 text-right">{profile?.surgeryType || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500 font-medium">Date</dt>
                    <dd className="font-semibold text-neutral-900 text-right">{surgeryDates()}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>
        </div>

        {/* Medications */}
        <section className="mt-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <Pill size={22} className="text-teal-600" /> Current Medications
          </h3>
          {meds.length === 0 ? (
            <p className="text-lg text-neutral-500">No active medications on file.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
              {meds.map((m) => (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between text-lg">
                  <span className="font-semibold text-neutral-900">{m.name}</span>
                  <span className="text-neutral-700">
                    {m.dosage}{m.unit ? ` ${m.unit}` : ''} · {m.frequency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Allergies */}
        <section className="mt-6">
          <h3 className="text-xl font-bold text-red-700 mb-2">Allergies</h3>
          <p className="text-xl text-red-700 font-semibold">{profile?.allergies || 'None reported'}</p>
          {profile?.otherConditions && (
            <p className="mt-2 text-lg text-neutral-700">
              <span className="font-semibold">Other conditions: </span>{profile.otherConditions}
            </p>
          )}
        </section>

        {/* Emergency contact + hospital */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <section>
            <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <Phone size={22} className="text-teal-600" /> Emergency Contact
            </h3>
            <div className="space-y-1 text-xl">
              <p className="font-bold text-neutral-900">{profile?.emergencyContact || '—'}</p>
              {profile?.emergencyPhone ? (
                <a href={`tel:${profile.emergencyPhone}`} className="block text-2xl font-extrabold text-teal-700 underline">
                  {profile.emergencyPhone}
                </a>
              ) : (
                <p className="text-neutral-500">—</p>
              )}
              {profile?.emergencyRelation && (
                <p className="text-neutral-600">{profile.emergencyRelation}</p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-neutral-900 mb-3 flex items-center gap-2">
              <Stethoscope size={22} className="text-teal-600" /> Hospital / Neurologist
            </h3>
            <div className="space-y-1 text-xl">
              <p className="font-semibold text-neutral-900">{profile?.hospitalName || '—'}</p>
              <p className="text-neutral-800">{profile?.neurologistName || '—'}</p>
              {profile?.neurologistPhone ? (
                <a href={`tel:${profile.neurologistPhone}`} className="block text-2xl font-extrabold text-teal-700 underline">
                  {profile.neurologistPhone}
                </a>
              ) : null}
            </div>
          </section>
        </div>

        {/* Critical warnings */}
        <section className="mt-6 bg-red-50 border-2 border-red-600 rounded-xl p-5">
          <h3 className="text-xl font-extrabold text-red-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={22} /> Critical Warnings
          </h3>
          <ul className="space-y-2 text-lg text-red-800 font-medium list-disc pl-6">
            <li>Avoid dehydration — risk of ischemic stroke</li>
            <li>Avoid hyperventilation and breath-holding</li>
            <li>Maintain blood pressure within target range</li>
            <li>If unconscious or showing stroke symptoms: call emergency immediately</li>
          </ul>
        </section>

        <p className="mt-6 text-sm text-neutral-500 text-center">
          This card is generated by MoyaMoya Companion. Data last updated by patient.
        </p>
      </div>
    </div>
  );
}
