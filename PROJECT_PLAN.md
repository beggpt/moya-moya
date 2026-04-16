# MoyaMoya Companion - Project Plan

## Overview
Web aplikacija za pacijente s moyamoya bolešću. Prva dedicirana moyamoya app na tržištu.
Later: React Native mobile app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom JWT + Google OAuth (google-auth-library) |
| State | Zustand |
| Styling | Tailwind CSS (custom theme) |
| Icons | Lucide React |
| Email | Resend |
| Validation | Zod |
| Charts | Recharts |
| Mobile (later) | React Native |

---

## Project Structure

```
moyamoya/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/             # Auth group
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (patient)/          # Patient routes
│   │   │   │   ├── dashboard/
│   │   │   │   ├── symptoms/
│   │   │   │   ├── medications/
│   │   │   │   ├── blood-pressure/
│   │   │   │   ├── cognitive/
│   │   │   │   ├── appointments/
│   │   │   │   ├── reports/
│   │   │   │   ├── emergency/
│   │   │   │   ├── exercise/
│   │   │   │   └── profile/
│   │   │   ├── (caregiver)/        # Caregiver routes
│   │   │   │   └── care/
│   │   │   ├── (admin)/            # Admin routes
│   │   │   │   ├── admin/
│   │   │   │   ├── admin/users/
│   │   │   │   ├── admin/users/[id]/
│   │   │   │   ├── admin/content/
│   │   │   │   └── admin/reports/
│   │   │   ├── emergency/[userId]/ # Public emergency card
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # Landing page
│   │   ├── components/
│   │   │   ├── ui/                 # Base UI components
│   │   │   ├── dashboard/          # Dashboard widgets
│   │   │   ├── symptoms/           # Symptom tracker components
│   │   │   ├── medications/        # Med management components
│   │   │   ├── admin/              # Admin components
│   │   │   ├── shared/             # Navbar, SOS button, etc.
│   │   │   └── onboarding/         # Onboarding flow
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance
│   │   │   ├── store.ts            # Zustand stores
│   │   │   └── utils.ts            # Helpers
│   │   └── types/
│   │       └── index.ts
│   ├── public/
│   ├── tailwind.config.js
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts                # Express app
│   │   ├── routes/
│   │   │   ├── auth.ts             # Register, login, Google OAuth
│   │   │   ├── patients.ts         # Patient CRUD, profile
│   │   │   ├── symptoms.ts         # Symptom logging
│   │   │   ├── medications.ts      # Med management + reminders
│   │   │   ├── bloodPressure.ts    # BP readings
│   │   │   ├── cognitive.ts        # Cognitive tests
│   │   │   ├── appointments.ts     # Appointment management
│   │   │   ├── emergency.ts        # Emergency card, SOS
│   │   │   ├── reports.ts          # Report generation
│   │   │   ├── caregiver.ts        # Caregiver links
│   │   │   └── admin.ts            # Admin endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts             # JWT verification
│   │   │   └── admin.ts            # Admin role check
│   │   ├── services/
│   │   │   ├── email.ts            # Resend integration
│   │   │   └── notifications.ts    # Push notifications
│   │   └── utils/
│   │       └── prisma.ts           # Prisma client
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── .env.example
├── PROJECT_PLAN.md
└── README.md
```

---

## Design System

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Body text | Atkinson Hyperlegible | 18px (1.125rem) | 400 |
| Secondary text | Atkinson Hyperlegible | 16px (1rem) | 400 |
| Headings | Inter | 24-32px | 600-700 |
| Labels/captions | Inter | 14px (0.875rem) | 500 |
| SOS button | Inter | 14px | 700 |

**Line height:** 1.6 for body, 1.3 for headings
**Max line length:** 65ch
**Min text size:** 14px (nothing smaller)

### Color Palette

```
Primary (Teal - trust, calm, medical):
  50:  #E6F7F7
  100: #B3E8E8
  200: #80D9D9
  300: #4DC9C9
  400: #26BEBE
  500: #0D9488  ← main
  600: #0B7A6F
  700: #086156
  800: #05473E
  900: #032E28

Neutral (Warm grays):
  50:  #FAFAF9  ← background
  100: #F5F5F4
  200: #E7E5E4
  300: #D6D3D1
  400: #A8A29E
  500: #78716C
  600: #57534E
  700: #44403C
  800: #292524  ← body text
  900: #1C1917

Semantic:
  Success: #16A34A
  Warning: #CA8A04
  Danger:  #DC2626  ← SOS, emergencies only
  Info:    #2563EB

Charts:
  1: #0D9488 (Teal)
  2: #2563EB (Blue)
  3: #9333EA (Purple)
  4: #CA8A04 (Amber)
  5: #DC2626 (Red)
  6: #059669 (Emerald)
```

### Accessibility Requirements

- WCAG 2.2 AAA contrast (7:1 ratio)
- Touch targets: 48x48px minimum, 56x56px for critical actions
- One-handed navigation (primary actions in bottom 50% on mobile)
- Voice input on all text fields (Web Speech API)
- Reduced motion support (@media prefers-reduced-motion)
- Auto-save all form state
- Font scaling up to 200% without layout break
- Screen reader compatible (aria labels, logical heading hierarchy)
- No content flashes >3 times/second

---

## Authentication & Roles

### Auth Flow
1. **Register**: Email/password + email verification (Resend) OR Google OAuth
2. **Login**: Email/password OR Google OAuth
3. **JWT**: 30-day expiration, stored in localStorage
4. **Onboarding**: First login triggers 5-step setup wizard

### Roles

| Role | Access |
|------|--------|
| ADMIN | Full system access, user management, all patient data, analytics |
| PATIENT | Own data only: symptoms, meds, BP, appointments, emergency card |
| CAREGIVER | Linked patient data (configurable: read-only / read+alerts / full) |

---

## Database Schema

### Core Models

**User** - Authentication & base profile
- id, email, passwordHash, googleId, name, image, role, emailVerified
- Relations: profile, symptoms, medications, bpReadings, cognitiveTests, appointments

**PatientProfile** - Medical information (1:1 with User)
- dateOfBirth, gender, diagnosisDate, moyamoyaType (DISEASE/SYNDROME)
- suzukiStage (1-6), affectedSide (LEFT/RIGHT/BILATERAL)
- hadSurgery, surgeryType, surgeryDate
- bloodType, allergies, emergencyPhone, emergencyContact
- adminNotes (visible only to admin)

**SymptomLog** - TIA and symptom tracking
- timestamp, type (TIA/HEADACHE/WEAKNESS/NUMBNESS/SPEECH/VISION/SEIZURE/DIZZINESS/OTHER)
- severity (1-10), duration (minutes), bodyArea (JSON for body map)
- trigger, activity, notes, wasEmergency

**Medication** - Active medications
- name, dosage, frequency, timeOfDay, startDate, endDate, active
- Has many MedReminder (scheduledAt, takenAt, skipped, skipReason)

**BPReading** - Blood pressure log
- systolic, diastolic, heartRate, position (LYING/SITTING/STANDING), timestamp, notes

**CognitiveTest** - Mini cognitive assessments
- testType (reaction_time/memory/pattern), score, duration, timestamp

**Appointment** - Doctor visits
- doctorName, specialty, date, location, notes, questions, completed

**CaregiverLink** - Caregiver-Patient relationships
- caregiverId, patientId, permission (READ_ONLY/READ_ALERTS/FULL_ACCESS)

---

## Page Breakdown

### Public Pages

| Page | Purpose |
|------|---------|
| `/` | Landing page - hero, features, CTA |
| `/login` | Login form (Google + Email) |
| `/register` | Registration form |
| `/emergency/:userId` | Public emergency ID card (QR accessible) |

### Patient Pages

| Page | Purpose |
|------|---------|
| `/dashboard` | Main hub: today's status, med reminders, quick-log, weekly trend |
| `/symptoms` | Symptom history, body map, add new, filters |
| `/medications` | Active meds, reminders, adherence %, add new |
| `/blood-pressure` | BP log, trend chart, target range |
| `/cognitive` | Mini-tests (reaction time, memory, patterns), trend |
| `/appointments` | Upcoming & past, add new, pre-visit summary generator |
| `/reports` | Generate PDF report for doctor (date range selectable) |
| `/emergency` | Setup emergency card, contacts, SOS settings |
| `/exercise` | Activity log, safe/unsafe activities guide |
| `/profile` | Personal info, diagnosis details, settings, caregiver invites |

### Admin Pages

| Page | Purpose |
|------|---------|
| `/admin` | Dashboard: KPIs, charts, patient overview |
| `/admin/users` | User list with search, filter, sort, export CSV |
| `/admin/users/:id` | Full patient detail: profile, all logs, charts, admin notes |
| `/admin/content` | Manage educational content |
| `/admin/reports` | Aggregate analytics, export |

### Caregiver Pages

| Page | Purpose |
|------|---------|
| `/care` | Linked patients overview |
| `/care/:patientId` | View patient data (based on permission level) |

---

## API Routes

### Auth
```
POST   /api/auth/register          # Email registration
POST   /api/auth/login             # Email login
POST   /api/auth/google            # Google OAuth
GET    /api/auth/me                # Current user
PUT    /api/auth/profile           # Update profile
POST   /api/auth/verify-email      # Email verification
POST   /api/auth/forgot-password   # Password reset
```

### Patient
```
GET    /api/patient/profile        # Get patient profile
PUT    /api/patient/profile        # Update patient profile
POST   /api/patient/onboarding     # Complete onboarding
```

### Symptoms
```
GET    /api/symptoms               # List (with filters, pagination)
POST   /api/symptoms               # Log new symptom
GET    /api/symptoms/:id           # Get detail
PUT    /api/symptoms/:id           # Update
DELETE /api/symptoms/:id           # Delete
GET    /api/symptoms/stats         # Aggregated stats for charts
```

### Medications
```
GET    /api/medications            # List active meds
POST   /api/medications            # Add medication
PUT    /api/medications/:id        # Update
DELETE /api/medications/:id        # Remove
POST   /api/medications/:id/taken  # Mark reminder as taken
POST   /api/medications/:id/skip   # Skip with reason
GET    /api/medications/adherence  # Adherence percentage
```

### Blood Pressure
```
GET    /api/bp                     # List readings
POST   /api/bp                     # Add reading
DELETE /api/bp/:id                 # Delete
GET    /api/bp/stats               # Trends, averages
```

### Cognitive Tests
```
GET    /api/cognitive              # Test history
POST   /api/cognitive              # Submit test result
GET    /api/cognitive/stats        # Trends
```

### Appointments
```
GET    /api/appointments           # List
POST   /api/appointments           # Create
PUT    /api/appointments/:id       # Update
DELETE /api/appointments/:id       # Delete
```

### Emergency
```
GET    /api/emergency/card         # Get emergency card data
PUT    /api/emergency/card         # Update card
POST   /api/emergency/sos          # Trigger SOS (notify contacts)
GET    /api/emergency/public/:id   # Public card endpoint (no auth)
```

### Reports
```
POST   /api/reports/generate       # Generate PDF report
GET    /api/reports                # List generated reports
```

### Caregiver
```
POST   /api/caregiver/invite       # Send invite
GET    /api/caregiver/patients     # List linked patients
PUT    /api/caregiver/:linkId      # Update permissions
DELETE /api/caregiver/:linkId      # Remove link
```

### Admin
```
GET    /api/admin/dashboard        # KPIs and stats
GET    /api/admin/users            # All users (paginated, filterable)
GET    /api/admin/users/:id        # Full user detail + all data
PUT    /api/admin/users/:id/notes  # Admin notes on patient
GET    /api/admin/users/:id/export # Export patient data
GET    /api/admin/analytics        # Aggregate analytics
POST   /api/admin/content          # Create educational content
```

---

## Implementation Phases

### Phase 1 - MVP (Core)
1. Project setup (Next.js + Express + Prisma + PostgreSQL)
2. Auth (register, login, Google OAuth)
3. Patient profile + onboarding
4. Symptom tracker (quick-log + detailed)
5. Medication management + reminders
6. Blood pressure logging
7. Emergency ID card + SOS button
8. Basic admin dashboard (user list, details)
9. Landing page

### Phase 2 - Growth
1. Cognitive mini-tests
2. Appointment management
3. Doctor report generation (PDF)
4. Caregiver linking + dashboard
5. Exercise tracker
6. Weather/altitude alerts
7. Weekly trend summaries
8. Admin analytics + charts

### Phase 3 - Differentiators
1. Voice input (Web Speech API)
2. Educational content system
3. Community forum
4. Specialist directory
5. Clinical trials integration
6. i18n (HR, EN, JP, KR)
7. Push notifications
8. React Native mobile app

---

## UX Principles

1. **Single primary action per screen** - never overwhelm
2. **Symptom logging under 10 seconds** - quick-log buttons
3. **SOS always visible** - fixed position, red, 56x56px
4. **Progressive disclosure** - show basics, expand for details
5. **Positive language** - "Your headache frequency is down 20%"
6. **Auto-save everything** - never lose patient data
7. **Max 3-4 notifications/day** - no alert fatigue
8. **Cards over tables** - each card = one action
9. **Bottom navigation on mobile** - reachable with one hand
10. **Offline-capable** - critical features work without internet
