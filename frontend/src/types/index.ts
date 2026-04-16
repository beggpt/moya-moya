export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'PATIENT' | 'CAREGIVER';
  image: string | null;
  locale?: string;
  emailVerified?: boolean;
  profile?: { onboardingCompleted: boolean } | null;
}

export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  diagnosisDate: string | null;
  moyamoyaType: 'DISEASE' | 'SYNDROME' | null;
  suzukiStage: number | null;
  affectedSide: 'LEFT' | 'RIGHT' | 'BILATERAL' | null;
  underlyingCondition: string | null;
  hadSurgery: boolean;
  surgeryType: string | null;
  surgeryDate: string | null;
  surgeryNotes: string | null;
  bloodType: string | null;
  allergies: string | null;
  otherConditions: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  hospitalName: string | null;
  neurologistName: string | null;
  neurologistPhone: string | null;
  bpTargetSystolicMin: number | null;
  bpTargetSystolicMax: number | null;
  bpTargetDiastolicMin: number | null;
  bpTargetDiastolicMax: number | null;
  onboardingCompleted: boolean;
  adminNotes: string | null;
}

export interface SymptomLog {
  id: string;
  userId: string;
  timestamp: string;
  type: SymptomType;
  severity: number;
  durationMin: number | null;
  bodyArea: string | null;
  trigger: string | null;
  activity: string | null;
  notes: string | null;
  wasEmergency: boolean;
}

export type SymptomType =
  | 'TIA' | 'HEADACHE' | 'WEAKNESS' | 'NUMBNESS' | 'SPEECH_DIFFICULTY'
  | 'VISION_CHANGE' | 'SEIZURE' | 'DIZZINESS' | 'CONFUSION' | 'BALANCE_LOSS' | 'OTHER';

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  TIA: 'TIA',
  HEADACHE: 'Glavobolja',
  WEAKNESS: 'Slabost',
  NUMBNESS: 'Utrnulost',
  SPEECH_DIFFICULTY: 'Poteškoće s govorom',
  VISION_CHANGE: 'Promjene vida',
  SEIZURE: 'Napadaj',
  DIZZINESS: 'Vrtoglavica',
  CONFUSION: 'Konfuzija',
  BALANCE_LOSS: 'Gubitak ravnoteže',
  OTHER: 'Ostalo',
};

export const SYMPTOM_ICONS: Record<SymptomType, string> = {
  TIA: '⚡', HEADACHE: '🤕', WEAKNESS: '💪', NUMBNESS: '🖐️',
  SPEECH_DIFFICULTY: '🗣️', VISION_CHANGE: '👁️', SEIZURE: '⚠️',
  DIZZINESS: '😵', CONFUSION: '🧠', BALANCE_LOSS: '🏃', OTHER: '📋',
};

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  timesOfDay: string[];
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  reminders?: MedReminder[];
}

export interface MedReminder {
  id: string;
  scheduledAt: string;
  takenAt: string | null;
  skipped: boolean;
  skipReason: string | null;
}

export interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  heartRate: number | null;
  position: 'LYING' | 'SITTING' | 'STANDING' | null;
  timestamp: string;
  notes: string | null;
}

export interface CognitiveTest {
  id: string;
  testType: string;
  score: number;
  maxScore: number | null;
  duration: number;
  timestamp: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  location: string | null;
  phone: string | null;
  notes: string | null;
  questions: string | null;
  completed: boolean;
}

export interface ExerciseLog {
  id: string;
  activity: string;
  intensity: 'LOW' | 'MODERATE' | 'HIGH';
  safety: 'SAFE' | 'CAUTION' | 'AVOID';
  durationMin: number;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  hydrated: boolean;
  symptoms: string | null;
  notes: string | null;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
