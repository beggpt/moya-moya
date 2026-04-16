'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, Info, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const steps = ['Osobni podaci', 'Dijagnoza', 'Operacija', 'Lijekovi', 'Hitni kontakt'];

const FREQUENCY_OPTIONS = [
  { value: '1x dnevno', label: 'Jednom dnevno', times: 1 },
  { value: '2x dnevno', label: 'Dva puta dnevno', times: 2 },
  { value: '3x dnevno', label: 'Tri puta dnevno', times: 3 },
];

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

    // When frequency changes, adjust timesOfDay array
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
    try {
      const profileData: any = { ...profile };
      if (profileData.height) profileData.height = parseFloat(profileData.height);
      if (profileData.weight) profileData.weight = parseFloat(profileData.weight);
      if (profileData.suzukiStage) profileData.suzukiStage = parseInt(profileData.suzukiStage);
      if (!profileData.affectedSide) delete profileData.affectedSide;

      const activeMeds = medications.filter((m) => m.name.trim());

      await api.post('/patient/onboarding', {
        profile: profileData,
        medications: activeMeds,
      });

      updateUser({ profile: { onboardingCompleted: true } });
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
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
          <p className="text-sm text-neutral-500 mb-6">Korak {step + 1} od {steps.length}</p>

          {/* Step 0: Personal info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Datum rođenja</label>
                <input type="date" value={profile.dateOfBirth} onChange={(e) => updateProfile('dateOfBirth', e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Spol</label>
                <select value={profile.gender} onChange={(e) => updateProfile('gender', e.target.value)} className="input">
                  <option value="">Odaberi...</option>
                  <option value="male">Muško</option>
                  <option value="female">Žensko</option>
                  <option value="other">Ostalo</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Visina (cm)</label>
                  <input type="number" value={profile.height} onChange={(e) => updateProfile('height', e.target.value)} className="input" placeholder="170" />
                </div>
                <div>
                  <label className="label">Težina (kg)</label>
                  <input type="number" value={profile.weight} onChange={(e) => updateProfile('weight', e.target.value)} className="input" placeholder="70" />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Diagnosis */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Datum dijagnoze</label>
                <input type="date" value={profile.diagnosisDate} onChange={(e) => updateProfile('diagnosisDate', e.target.value)} className="input" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="label mb-0">Tip</label>
                  <button
                    type="button"
                    onClick={() => setInfoModal({
                      title: 'Bolest ili Sindrom?',
                      text: 'Moyamoya bolest (idiopatska) znači da je suženje arterija primarno i nema poznati uzrok. Moyamoya sindrom znači da je suženje sekundarno — nastalo kao posljedica druge bolesti ili stanja (npr. nakon radioterapije, srpaste anemije i sl.). Vaš neurolog ili neurokirurg vam može potvrditi o kojem se tipu radi na temelju vaše dijagnostike.',
                    })}
                    className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                    aria-label="Više informacija o tipu"
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
                      <p className="font-semibold text-neutral-800">{t === 'DISEASE' ? 'Bolest' : 'Sindrom'}</p>
                      <p className="text-xs text-neutral-500 mt-1">{t === 'DISEASE' ? 'Idiopatska (primarno suženje)' : 'Sekundarna (poznati uzrok)'}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="label mb-0">Suzuki stadij (1-6)</label>
                  <button
                    type="button"
                    onClick={() => setInfoModal({
                      title: 'Suzuki stadij',
                      text: 'Suzuki klasifikacija (1-6) opisuje stupanj napredovanja moyamoya bolesti na angiografiji. Stadij 1 je blagi (početno suženje), a stadij 6 je najteži (potpuni gubitak moyamoya vaskulature). Vaš stadij određuje neurolog na temelju cerebralne angiografije ili MR angiografije. Ako niste sigurni, pitajte svog neurologa na sljedećem pregledu.',
                    })}
                    className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                    aria-label="Više informacija o Suzuki stadiju"
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
                <label className="label">Zahvaćena strana</label>
                <div className="grid grid-cols-3 gap-3">
                  {([['LEFT', 'Lijeva'], ['RIGHT', 'Desna'], ['BILATERAL', 'Obostrana']] as const).map(([val, label]) => (
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
                <label className="label">Jeste li imali operaciju?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button" onClick={() => updateProfile('hadSurgery', val)}
                      className={`p-4 rounded-xl border text-center font-medium transition-all ${
                        profile.hadSurgery === val ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600'
                      }`}
                    >{val ? 'Da' : 'Ne'}</button>
                  ))}
                </div>
              </div>
              {profile.hadSurgery && (
                <>
                  <div>
                    <label className="label">Tip operacije</label>
                    <select value={profile.surgeryType} onChange={(e) => updateProfile('surgeryType', e.target.value)} className="input">
                      <option value="">Odaberi...</option>
                      <option value="STA-MCA bypass (direktni)">STA-MCA bypass (direktni)</option>
                      <option value="EDAS (indirektni)">EDAS (indirektni)</option>
                      <option value="EMS (indirektni)">EMS (indirektni)</option>
                      <option value="EDMS (indirektni)">EDMS (indirektni)</option>
                      <option value="Kombinirani (direktni + indirektni)">Kombinirani (direktni + indirektni)</option>
                      <option value="Ostalo">Ostalo</option>
                    </select>
                  </div>

                  {profile.affectedSide === 'BILATERAL' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Datum operacije — lijeva strana</label>
                        <input type="date" value={profile.surgeryDateLeft} onChange={(e) => updateProfile('surgeryDateLeft', e.target.value)} className="input" />
                      </div>
                      <div>
                        <label className="label">Datum operacije — desna strana</label>
                        <input type="date" value={profile.surgeryDateRight} onChange={(e) => updateProfile('surgeryDateRight', e.target.value)} className="input" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label">Datum operacije</label>
                      <input type="date" value={profile.surgeryDate} onChange={(e) => updateProfile('surgeryDate', e.target.value)} className="input" />
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="label">Alergije</label>
                <input type="text" value={profile.allergies} onChange={(e) => updateProfile('allergies', e.target.value)} className="input" placeholder="Nema / navedi alergije" />
              </div>
            </div>
          )}

          {/* Step 3: Medications */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">Unesite lijekove koje trenutno uzimate. Postavite vrijeme za podsjetnike.</p>
              {medications.map((med, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Naziv lijeka</label>
                      <input type="text" value={med.name}
                        onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                        className="input" placeholder="Aspirin"
                      />
                    </div>
                    <div>
                      <label className="label">Doza</label>
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
                    <label className="label">Učestalost</label>
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
                    <label className="label">Vrijeme uzimanja (za podsjetnike)</label>
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
                + Dodaj lijek
              </button>
            </div>
          )}

          {/* Step 4: Emergency contact */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="label">Ime kontakta za hitne slučajeve</label>
                <input type="text" value={profile.emergencyContact} onChange={(e) => updateProfile('emergencyContact', e.target.value)} className="input" placeholder="Marko Horvat" />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input type="tel" value={profile.emergencyPhone} onChange={(e) => updateProfile('emergencyPhone', e.target.value)} className="input" placeholder="+385 91 123 4567" />
              </div>
              <div>
                <label className="label">Odnos</label>
                <select value={profile.emergencyRelation} onChange={(e) => updateProfile('emergencyRelation', e.target.value)} className="input">
                  <option value="">Odaberi...</option>
                  <option value="Suprug/a">Suprug/a</option>
                  <option value="Roditelj">Roditelj</option>
                  <option value="Dijete">Dijete</option>
                  <option value="Brat/Sestra">Brat/Sestra</option>
                  <option value="Prijatelj">Prijatelj</option>
                  <option value="Ostalo">Ostalo</option>
                </select>
              </div>
              <hr className="my-4" />
              <div>
                <label className="label">Bolnica (opcionalno)</label>
                <input type="text" value={profile.hospitalName} onChange={(e) => updateProfile('hospitalName', e.target.value)} className="input" placeholder="KBC Zagreb" />
              </div>
              <div>
                <label className="label">Neurolog (opcionalno)</label>
                <input type="text" value={profile.neurologistName} onChange={(e) => updateProfile('neurologistName', e.target.value)} className="input" placeholder="Dr. Horvat" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="btn-ghost">
                <ChevronLeft className="w-5 h-5 mr-1" /> Natrag
              </button>
            ) : <div />}

            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="btn-primary">
                Dalje <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button onClick={handleComplete} disabled={saving} className="btn-primary">
                {saving ? 'Spremanje...' : 'Završi'} <Check className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-4">
          Sve podatke možete kasnije izmijeniti u postavkama profila.
        </p>
      </div>
    </div>
  );
}
