'use client';

import { useEffect, useRef, useState } from 'react';
import { User as UserIcon, Stethoscope, Activity, AlertTriangle, Check, Loader2, Camera, Upload, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

/** DD/MM/YYYY date input that stores ISO (YYYY-MM-DD) internally */
function DateInput({ value, onChange, className }: { value: string; onChange: (iso: string) => void; className?: string }) {
  const toDisplay = (iso: string) => {
    if (!iso) return '';
    const clean = iso.slice(0, 10);
    const [y, m, d] = clean.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
  };
  const toISO = (display: string) => {
    const parts = display.split('/');
    if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${parts[2]}-${m}-${d}`;
    }
    return '';
  };

  const [display, setDisplay] = useState(toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length <= 2) val = digits;
    else if (digits.length <= 4) val = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    else val = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    setDisplay(val);
    if (digits.length === 8) {
      const iso = toISO(val);
      if (iso) onChange(iso);
    } else if (val === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (display && display.length >= 8) {
      const iso = toISO(display);
      if (iso) {
        setDisplay(toDisplay(iso));
        onChange(iso);
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="DD/MM/YYYY"
      className={className || 'input'}
      maxLength={10}
    />
  );
}

type TabId = 'account' | 'medical' | 'bp' | 'danger';

async function resizeImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initialsOf(name?: string | null, email?: string | null): string {
  const src = (name || email || '?').trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

interface PatientProfileData {
  city?: string | null;
  country?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  height?: number | string | null;
  weight?: number | string | null;
  diagnosisDate?: string | null;
  moyamoyaType?: 'DISEASE' | 'SYNDROME' | null;
  suzukiStage?: number | string | null;
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
  bpTargetSystolicMin?: number | string | null;
  bpTargetSystolicMax?: number | string | null;
  bpTargetDiastolicMin?: number | string | null;
  bpTargetDiastolicMax?: number | string | null;
}

function Feedback({ state }: { state: 'idle' | 'saving' | 'success' | 'error'; }) {
  if (state === 'saving') return <span className="text-neutral-500 flex items-center gap-1 text-sm"><Loader2 size={14} className="animate-spin" /> Saving…</span>;
  if (state === 'success') return <span className="text-teal-600 flex items-center gap-1 text-sm font-medium"><Check size={16} /> Saved</span>;
  if (state === 'error') return <span className="text-red-600 text-sm font-medium">Error saving</span>;
  return null;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [tab, setTab] = useState<TabId>('account');

  // Account tab state
  const [accName, setAccName] = useState('');
  const [accImage, setAccImage] = useState<string | null>('');
  const [accState, setAccState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Medical tab
  const [profile, setProfile] = useState<PatientProfileData>({});
  const [medState, setMedState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [bpState, setBpState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/patient/profile'),
        ]);
        setAccName(meRes.data?.name || '');
        setAccImage(meRes.data?.image || '');
        const p = profileRes.data || {};
        setProfile({
          ...p,
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
          diagnosisDate: p.diagnosisDate ? String(p.diagnosisDate).slice(0, 10) : '',
          surgeryDate: p.surgeryDate ? String(p.surgeryDate).slice(0, 10) : '',
          surgeryDateLeft: p.surgeryDateLeft ? String(p.surgeryDateLeft).slice(0, 10) : '',
          surgeryDateRight: p.surgeryDateRight ? String(p.surgeryDateRight).slice(0, 10) : '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateProfileField = <K extends keyof PatientProfileData>(key: K, value: PatientProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const saveAccount = async () => {
    setAccState('saving');
    try {
      const res = await api.put('/auth/profile', { name: accName });
      updateUser({ name: res.data.name });
      setAccState('success');
      setTimeout(() => setAccState('idle'), 2000);
    } catch {
      setAccState('error');
      setTimeout(() => setAccState('idle'), 3000);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Warning: file is larger than 5MB. It will be resized and compressed.');
    }
    setPhotoUploading(true);
    try {
      const dataUrl = await resizeImage(file, 400);
      setAccImage(dataUrl); // optimistic preview
      const res = await api.put('/auth/profile', { image: dataUrl });
      updateUser({ image: res.data.image });
      setAccImage(res.data.image);
    } catch (err) {
      console.error(err);
      setPhotoError('Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const res = await api.put('/auth/profile', { image: null });
      updateUser({ image: res.data.image ?? null });
      setAccImage(res.data.image ?? null);
    } catch (err) {
      console.error(err);
      setPhotoError('Failed to remove photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const buildProfilePayload = () => {
    const payload: any = { ...profile };
    if (payload.height !== '' && payload.height != null) payload.height = parseFloat(String(payload.height));
    else payload.height = null;
    if (payload.weight !== '' && payload.weight != null) payload.weight = parseFloat(String(payload.weight));
    else payload.weight = null;
    if (payload.suzukiStage !== '' && payload.suzukiStage != null) payload.suzukiStage = parseInt(String(payload.suzukiStage));
    else payload.suzukiStage = null;
    for (const k of ['bpTargetSystolicMin', 'bpTargetSystolicMax', 'bpTargetDiastolicMin', 'bpTargetDiastolicMax']) {
      if (payload[k] !== '' && payload[k] != null) payload[k] = parseInt(String(payload[k]));
      else payload[k] = null;
    }
    return payload;
  };

  const saveMedical = async () => {
    setMedState('saving');
    try {
      await api.put('/patient/profile', buildProfilePayload());
      setMedState('success');
      setTimeout(() => setMedState('idle'), 2000);
    } catch {
      setMedState('error');
      setTimeout(() => setMedState('idle'), 3000);
    }
  };

  const saveBp = async () => {
    setBpState('saving');
    try {
      await api.put('/patient/profile', buildProfilePayload());
      setBpState('success');
      setTimeout(() => setBpState('idle'), 2000);
    } catch {
      setBpState('error');
      setTimeout(() => setBpState('idle'), 3000);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      alert('Account deletion is not implemented yet. Please contact support.');
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'medical', label: 'Medical info', icon: Stethoscope },
    { id: 'bp', label: 'Blood pressure targets', icon: Activity },
    { id: 'danger', label: 'Danger zone', icon: AlertTriangle },
  ];

  if (loading) {
    return <div className="text-neutral-500">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">My Profile</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-neutral-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              } ${t.id === 'danger' && active ? 'border-red-600 text-red-700' : ''}`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'account' && (
        <div className="card space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">Account</h2>

          <div>
            <label className="label">Profile photo</label>
            <div className="flex items-center gap-5 mt-2">
              <div className="relative">
                {accImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={accImage} alt="avatar" className="w-24 h-24 rounded-full object-cover border border-neutral-200" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-teal-500 text-white flex items-center justify-center text-2xl font-bold border border-neutral-200">
                    {initialsOf(accName, user?.email)}
                  </div>
                )}
                {photoUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 size={22} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60"
                >
                  {accImage ? <Camera size={16} /> : <Upload size={16} />}
                  {accImage ? 'Change photo' : 'Upload photo'}
                </button>
                {accImage && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={photoUploading}
                    className="text-sm text-neutral-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-60"
                  >
                    <X size={14} /> Remove photo
                  </button>
                )}
              </div>
            </div>
            {photoError && <p className="mt-2 text-sm text-amber-600">{photoError}</p>}
          </div>

          <div>
            <label className="label">Name</label>
            <input className="input" value={accName} onChange={(e) => setAccName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-neutral-100" value={user?.email || ''} readOnly />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Feedback state={accState} />
            <button onClick={saveAccount} disabled={accState === 'saving'} className="btn-primary">
              {accState === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'medical' && (
        <div className="card space-y-6">
          <h2 className="text-xl font-bold text-neutral-900">Medical info</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input className="input" value={profile.city || ''} onChange={(e) => updateProfileField('city', e.target.value)} placeholder="e.g. Zagreb" />
            </div>
            <div>
              <label className="label">Country</label>
              <input className="input" value={profile.country || ''} onChange={(e) => updateProfileField('country', e.target.value)} placeholder="e.g. Croatia" />
            </div>
            <div>
              <label className="label">Date of birth</label>
              <DateInput value={String(profile.dateOfBirth || '')} onChange={(v) => updateProfileField('dateOfBirth', v)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={profile.gender || ''} onChange={(e) => updateProfileField('gender', e.target.value)}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input type="number" className="input" value={profile.height ?? ''} onChange={(e) => updateProfileField('height', e.target.value)} />
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input type="number" className="input" value={profile.weight ?? ''} onChange={(e) => updateProfileField('weight', e.target.value)} />
            </div>
          </div>

          <hr />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Diagnosis date</label>
              <DateInput value={String(profile.diagnosisDate || '')} onChange={(v) => updateProfileField('diagnosisDate', v)} />
            </div>
            <div>
              <label className="label">Moyamoya type</label>
              <select className="input" value={profile.moyamoyaType || ''} onChange={(e) => updateProfileField('moyamoyaType', e.target.value as any)}>
                <option value="">Select…</option>
                <option value="DISEASE">Disease</option>
                <option value="SYNDROME">Syndrome</option>
              </select>
            </div>
            <div>
              <label className="label">Suzuki stage (1-6)</label>
              <select className="input" value={profile.suzukiStage ?? ''} onChange={(e) => updateProfileField('suzukiStage', e.target.value)}>
                <option value="">Select…</option>
                {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Affected side</label>
              <select className="input" value={profile.affectedSide || ''} onChange={(e) => updateProfileField('affectedSide', e.target.value as any)}>
                <option value="">Select…</option>
                <option value="LEFT">Left</option>
                <option value="RIGHT">Right</option>
                <option value="BILATERAL">Bilateral</option>
              </select>
            </div>
          </div>

          <hr />

          <div className="space-y-4">
            <div>
              <label className="label">Had surgery</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => updateProfileField('hadSurgery', val)}
                    className={`p-3 rounded-xl border text-center font-medium transition-all ${
                      profile.hadSurgery === val ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-neutral-200 text-neutral-600'
                    }`}
                  >{val ? 'Yes' : 'No'}</button>
                ))}
              </div>
            </div>

            {profile.hadSurgery && (
              <>
                <div>
                  <label className="label">Surgery type</label>
                  <select className="input" value={profile.surgeryType || ''} onChange={(e) => updateProfileField('surgeryType', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="STA-MCA bypass (direct)">STA-MCA bypass (direct)</option>
                    <option value="EDAS (indirect)">EDAS (indirect)</option>
                    <option value="EMS (indirect)">EMS (indirect)</option>
                    <option value="EDMS (indirect)">EDMS (indirect)</option>
                    <option value="Combined (direct + indirect)">Combined (direct + indirect)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {profile.affectedSide === 'BILATERAL' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Surgery — left</label>
                      <DateInput value={String(profile.surgeryDateLeft || '')} onChange={(v) => updateProfileField('surgeryDateLeft', v)} />
                    </div>
                    <div>
                      <label className="label">Surgery — right</label>
                      <DateInput value={String(profile.surgeryDateRight || '')} onChange={(v) => updateProfileField('surgeryDateRight', v)} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="label">Surgery date</label>
                    <DateInput value={String(profile.surgeryDate || '')} onChange={(v) => updateProfileField('surgeryDate', v)} />
                  </div>
                )}
              </>
            )}
          </div>

          <hr />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Allergies</label>
              <input className="input" value={profile.allergies || ''} onChange={(e) => updateProfileField('allergies', e.target.value)} placeholder="None / list allergies" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Other conditions</label>
              <input className="input" value={profile.otherConditions || ''} onChange={(e) => updateProfileField('otherConditions', e.target.value)} />
            </div>
          </div>

          <hr />

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Emergency contact</label>
              <input className="input" value={profile.emergencyContact || ''} onChange={(e) => updateProfileField('emergencyContact', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profile.emergencyPhone || ''} onChange={(e) => updateProfileField('emergencyPhone', e.target.value)} />
            </div>
            <div>
              <label className="label">Relation</label>
              <select className="input" value={profile.emergencyRelation || ''} onChange={(e) => updateProfileField('emergencyRelation', e.target.value)}>
                <option value="">Select…</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Sibling">Sibling</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Hospital</label>
              <input className="input" value={profile.hospitalName || ''} onChange={(e) => updateProfileField('hospitalName', e.target.value)} />
            </div>
            <div>
              <label className="label">Neurologist</label>
              <input className="input" value={profile.neurologistName || ''} onChange={(e) => updateProfileField('neurologistName', e.target.value)} />
            </div>
            <div>
              <label className="label">Neurologist phone</label>
              <input className="input" value={profile.neurologistPhone || ''} onChange={(e) => updateProfileField('neurologistPhone', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Feedback state={medState} />
            <button onClick={saveMedical} disabled={medState === 'saving'} className="btn-primary">
              {medState === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'bp' && (
        <div className="card space-y-4">
          <h2 className="text-xl font-bold text-neutral-900">Blood pressure targets</h2>
          <p className="text-sm text-neutral-500">
            These targets are used to color-code your readings on the blood pressure page.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Systolic min (mmHg)</label>
              <input type="number" className="input" value={profile.bpTargetSystolicMin ?? ''} onChange={(e) => updateProfileField('bpTargetSystolicMin', e.target.value)} placeholder="110" />
            </div>
            <div>
              <label className="label">Systolic max (mmHg)</label>
              <input type="number" className="input" value={profile.bpTargetSystolicMax ?? ''} onChange={(e) => updateProfileField('bpTargetSystolicMax', e.target.value)} placeholder="130" />
            </div>
            <div>
              <label className="label">Diastolic min (mmHg)</label>
              <input type="number" className="input" value={profile.bpTargetDiastolicMin ?? ''} onChange={(e) => updateProfileField('bpTargetDiastolicMin', e.target.value)} placeholder="70" />
            </div>
            <div>
              <label className="label">Diastolic max (mmHg)</label>
              <input type="number" className="input" value={profile.bpTargetDiastolicMax ?? ''} onChange={(e) => updateProfileField('bpTargetDiastolicMax', e.target.value)} placeholder="85" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Feedback state={bpState} />
            <button onClick={saveBp} disabled={bpState === 'saving'} className="btn-primary">
              {bpState === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {tab === 'danger' && (
        <div className="card border-2 border-red-200 space-y-4">
          <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle size={22} /> Danger zone
          </h2>
          <p className="text-neutral-700">
            Deleting your account is permanent. All your medical records, medications, and history will be removed.
          </p>
          <button onClick={handleDelete} className="btn-danger">
            Delete my account
          </button>
        </div>
      )}
    </div>
  );
}
