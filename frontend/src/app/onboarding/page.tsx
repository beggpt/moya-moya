'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, Info, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const steps = ['Personal info', 'Diagnosis', 'Surgery', 'Medications', 'Emergency contact'];

const FREQUENCY_OPTIONS = [
  { value: '1x dnevno', label: 'Once daily', times: 1 },
  { value: '2x dnevno', label: 'Twice daily', times: 2 },
  { value: '3x dnevno', label: 'Three times daily', times: 3 },
];

/** DD/MM/YYYY date input that stores ISO (YYYY-MM-DD) internally */
function DateInput({ value, onChange, className }: { value: string; onChange: (iso: string) => void; className?: string }) {
  // Convert ISO → display
  const toDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // Convert display → ISO
  const toISO = (display: string) => {
    const clean = display.replace(/[^0-9/]/g, '');
    const parts = clean.split('/');
    if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${parts[2]}-${m}-${d}`;
    }
    return '';
  };

  const [display, setDisplay] = useState(toDisplay(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Auto-insert slashes
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length <= 2) {
      val = digits;
    } else if (digits.length <= 4) {
      val = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      val = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setDisplay(val);

    // Only send to parent when we have a complete date
    if (digits.length === 8) {
      const iso = toISO(val);
      if (iso) onChange(iso);
    } else if (val === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Reformat on blur if valid
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

function InfoTooltip({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-neutral-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-lg">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <p className="text-sm text-neutral-700 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [infoModal, setInfoModal] = useState<{ title: string; text: string } | null>(null);
  const router = useRouter();
  const { updateUser } = useAuthStore();

  // Form data
  const [profile, setProfile] = useState({
    dateOfBirth: '', gender: '', height: '', weight: '',
    diagnosisDate: '', moyamoyaType: 'DISEASE' as 'DISEASE' | 'SYNDROME',
    suzukiStage: '', affectedSide: '' as '' | 'LEFT' | 'RIGHT' | 'BILATERAL',
    underlyingCondition: '',
    hadSurgery: false, surgeryType: '', surgeryDate: '', surgeryDateLeft: '', surgeryDateRight: '', surgeryNotes: '',
    allergies: '',
    emergencyContact: '', emergencyPhone: '', emergencyRelation: '',
    hospitalName: '', neurologistName: '', neurologistPhone: '',
  });

  const [medications, setMedications] = useState<any[]>([
    { name: 'Aspirin', dosage: '100', unit: 'mg', frequency: '1x dnevno', timesOfDay: ['08:00'] },
  ]);

  const updateProfile = (key: string, value: any) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const updateMedication = (idx: number, key: string, value: any) => {
    const updated = [...medications];
    updated[idx] = { ...updated[idx], [key]: value };

    if (key === 'frequency') {
      const opt = FREQUENCY_OPTIONS.find((o) => o.value === value);
      if (opt) {
        const defaults = ['08:00', '14:00', '20:00'];
        updated[idx].timesOfDay = defaults.slice(0, opt.times);
      }
    }

    setMedications(updated);
  };

  const updateMedTime = (medIdx: number, timeIdx: number, value: string) => {
    const updated = [...medications];
    const times = [...updated[medIdx].timesOfDay];
    times[timeIdx] = value;
    updated[medIdx] = { ...updated[medIdx], timesOfDay: times };
    setMedications(updated);
  };

  const handleComplete = async () => {
    setSaving(true);
    setError('');
    try {
      const profileData: any = {};

      // Clean: only send non-empty values, convert types
      for (const [key, val] of Object.entries(profile)) {
        if (val === '' || val === undefined) continue;
        profileData[key] = val;
      }

      if (profileData.height) profileData.height = parseFloat(profileData.height);
      if (profileData.weight) profileData.weight = parseFloat(profileData.weight);
      if (profileData.suzukiStage) profileData.suzukiStage = parseInt(profileData.suzukiStage);

      const activeMeds = medications.filter((m) => m.name.trim());

      await api.post('/patient/onboarding', {
        profile: profileData,
        medications: activeMeds,
      });

      updateUser({ profile: { onboardingCompleted: true } });
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      {infoModal && <InfoTooltip title={infoModal.title} text={infoModal.text} onClose={() => setInfoModal(null)} />}

      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-primary-500 text-white' :
                i === step ? 'bg-primary-500 text-white' :
                'bg-neutral-200 text-neutral-500'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-primary-500' : 'bg-neutral-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-neutral-900 mb-1">{steps[step]}</h2>
          <p className="text-sm text-neutral-500 mb-6">Step {step + 1} of {steps.length}</p>

          {error && (
            <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          {/* Step 0: Personal info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Date of birth</label>
                <DateInput value={profile.dateOfBirth} onChange={(v) => updateProfile('dateOfBirth', v)} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select value={profile.gender} onChange={(e) => updateProfile('gender', e.target.value)} className="input">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Height (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => updateProfile('height', e.target.value)} className="input" placeholder="170" />
                </div>
                <div>
                  <label className="label">Weight (kg)</label>
                  <input type="number" value={profile.weight} onChange={(e) => updateProfile('weight', e.target.value)} className="input" placeholder="70" />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Diagnosis */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Date of diagnosis</label>
                <DateInput value={profile.diagnosisDate} onChange={(v) => updateProfile('diagnosisDate', v)} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="label mb-0">Type</label>
                  <button
                    type="button"
                    onClick={() => setInfoModal({
                      title: 'Disease or Syndrome?',
                      text: 'Moyamoya disease (idiopathic) means the narrowing of the arteries is primary and has no known cause. Moyamoya syndrome means the narrowing is secondary — caused by another disease or condition (e.g., after radiotherapy, sickle cell anemia, etc.). Your neurologist or neurosurgeon can confirm which type you have based on your diagnostics.',
                    })}
                    className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                    aria-label="More information about type"
                  >
                    <Info size={16} className="text-primary-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['DISEASE', 'SYNDROME'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => updateProfile('moyamoyaType', t)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        profile.moyamoyaType === t ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className="font-semibold text-neutral-800">{t === 'DISEASE' ? 'Disease' : 'Syndrome'}</p>
                      <p className="text-xs text-neutral-500 mt-1">{t === 'DISEASE' ? 'Idiopathic (primary narrowing)' : 'Secondary (known cause)'}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="label mb-0">Suzuki stage (1-6)</label>
                  <button
                    type="button"
                    onClick={() => setInfoModal({
                      title: 'Suzuki stage',
                      text: 'The Suzuki classification (1-6) describes the degree of progression of moyamoya disease on angiography. Stage 1 is mild (initial narrowing), while stage 6 is the most severe (complete loss of moyamoya vasculature). Your stage is determined by a neurologist based on cerebral angiography or MR angiography. If you are unsure, ask your neurologist at your next appointment.',
                    })}
                    className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                    aria-label="More information about Suzuki stage"
                  >
                    <Info size={16} className="text-primary-500" />
                  </button>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <button key={s} type="button" onClick={() => updateProfile('suzukiStage', s.toString())}
                      className={`w-12 h-12 rounded-xl border font-bold transition-all ${
                        profile.suzukiStage === s.toString() ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Affected side</label>
                <div className="grid grid-cols-3 gap-3">
                  {([['LEFT', 'Left'], ['RIGHT', 'Right'], ['BILATERAL', 'Bilateral']] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => updateProfile('affectedSide', val)}
                      className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${
                        profile.affectedSide === val ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Surgery */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label">Have you had surgery?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button" onClick={() => updateProfile('hadSurgery', val)}
                      className={`p-4 rounded-xl border text-center font-medium transition-all ${
                        profile.hadSurgery === val ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                      }`}
                    >{val ? 'Yes' : 'No'}</button>
                  ))}
                </div>
              </div>
              {profile.hadSurgery && (
                <>
                  <div>
                    <label className="label">Surgery type</label>
                    <select value={profile.surgeryType} onChange={(e) => updateProfile('surgeryType', e.target.value)} className="input">
                      <option value="">Select...</option>
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
                        <DateInput value={profile.surgeryDateLeft} onChange={(v) => updateProfile('surgeryDateLeft', v)} />
                      </div>
                      <div>
                        <label className="label">Surgery — right</label>
                        <DateInput value={profile.surgeryDateRight} onChange={(v) => updateProfile('surgeryDateRight', v)} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label">Surgery date</label>
                      <DateInput value={profile.surgeryDate} onChange={(v) => updateProfile('surgeryDate', v)} />
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="label">Allergies</label>
                <input type="text" value={profile.allergies} onChange={(e) => updateProfile('allergies', e.target.value)} className="input" placeholder="None / list allergies" />
              </div>
            </div>
          )}

          {/* Step 3: Medications */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">Enter the medications you are currently taking. Set times for reminders.</p>
              {medications.map((med, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Medication name</label>
                      <input type="text" value={med.name}
                        onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                        className="input" placeholder="Aspirin"
                      />
                    </div>
                    <div>
                      <label className="label">Dose</label>
                      <div className="flex gap-2">
                        <input type="text" value={med.dosage}
                          onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                          className="input" placeholder="100"
                        />
                        <select value={med.unit}
                          onChange={(e) => updateMedication(idx, 'unit', e.target.value)}
                          className="input w-24"
                        >
                          <option value="mg">mg</option>
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label">Frequency</label>
                    <select value={med.frequency}
                      onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                      className="input"
                    >
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Time of day (for reminders)</label>
                    <div className="flex gap-2 flex-wrap">
                      {(med.timesOfDay || []).map((time: string, tIdx: number) => (
                        <div key={tIdx} className="flex items-center gap-1">
                          <span className="text-xs text-neutral-500">{tIdx + 1}.</span>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => updateMedTime(idx, tIdx, e.target.value)}
                            className="input w-32 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setMedications([...medications, { name: '', dosage: '', unit: 'mg', frequency: '1x dnevno', timesOfDay: ['08:00'] }])} className="btn-ghost w-full">
                + Add medication
              </button>
            </div>
          )}

          {/* Step 4: Emergency contact */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="label">Emergency contact name</label>
                <input type="text" value={profile.emergencyContact} onChange={(e) => updateProfile('emergencyContact', e.target.value)} className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" value={profile.emergencyPhone} onChange={(e) => updateProfile('emergencyPhone', e.target.value)} className="input" placeholder="+1 555 123 4567" />
              </div>
              <div>
                <label className="label">Relationship</label>
                <select value={profile.emergencyRelation} onChange={(e) => updateProfile('emergencyRelation', e.target.value)} className="input">
                  <option value="">Select...</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <hr className="my-4" />
              <div>
                <label className="label">Hospital (optional)</label>
                <input type="text" value={profile.hospitalName} onChange={(e) => updateProfile('hospitalName', e.target.value)} className="input" placeholder="General Hospital" />
              </div>
              <div>
                <label className="label">Neurologist (optional)</label>
                <input type="text" value={profile.neurologistName} onChange={(e) => updateProfile('neurologistName', e.target.value)} className="input" placeholder="Dr. Smith" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="btn-ghost">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back
              </button>
            ) : <div />}

            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary">
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Finish'} <Check className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-4">
          You can edit all this information later in profile settings.
        </p>
      </div>
    </div>
  );
}
