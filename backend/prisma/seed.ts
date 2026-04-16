import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@moyamoya.app' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@moyamoya.app',
      passwordHash: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // Create demo patient
  const patientPassword = await bcrypt.hash('patient123', 12);
  const patient = await prisma.user.upsert({
    where: { email: 'demo@moyamoya.app' },
    update: {},
    create: {
      email: 'demo@moyamoya.app',
      passwordHash: patientPassword,
      name: 'Ana Demo',
      role: 'PATIENT',
      emailVerified: true,
    },
  });

  // Create patient profile
  await prisma.patientProfile.upsert({
    where: { userId: patient.id },
    update: {},
    create: {
      userId: patient.id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'female',
      diagnosisDate: new Date('2023-03-01'),
      moyamoyaType: 'DISEASE',
      suzukiStage: 3,
      affectedSide: 'BILATERAL',
      hadSurgery: true,
      surgeryType: 'STA-MCA bypass + EDAS (kombinirani)',
      surgeryDate: new Date('2023-06-15'),
      bloodType: 'A+',
      allergies: 'Nema',
      emergencyContact: 'Marko Demo',
      emergencyPhone: '+385911234567',
      emergencyRelation: 'Suprug',
      hospitalName: 'KBC Zagreb',
      neurologistName: 'Dr. Horvat',
      neurologistPhone: '+38512345678',
      bpTargetSystolicMin: 100,
      bpTargetSystolicMax: 140,
      bpTargetDiastolicMin: 60,
      bpTargetDiastolicMax: 90,
      onboardingCompleted: true,
    },
  });

  // Add demo medications
  const aspirin = await prisma.medication.upsert({
    where: { id: 'demo-aspirin' },
    update: {},
    create: {
      id: 'demo-aspirin',
      userId: patient.id,
      name: 'Aspirin',
      dosage: '100',
      unit: 'mg',
      frequency: 'Jednom dnevno',
      timesOfDay: ['08:00'],
      instructions: 'Uzeti s hranom',
      startDate: new Date('2023-03-01'),
    },
  });

  // Add demo symptoms
  const symptomTypes = ['HEADACHE', 'TIA', 'DIZZINESS', 'WEAKNESS', 'NUMBNESS'] as const;
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    await prisma.symptomLog.create({
      data: {
        userId: patient.id,
        type: symptomTypes[Math.floor(Math.random() * symptomTypes.length)],
        severity: Math.floor(Math.random() * 7) + 1,
        durationMin: Math.floor(Math.random() * 30) + 5,
        trigger: ['dehidracija', 'stres', 'vježba', 'umor', null][Math.floor(Math.random() * 5)] || undefined,
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Add demo BP readings
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    await prisma.bPReading.create({
      data: {
        userId: patient.id,
        systolic: 110 + Math.floor(Math.random() * 30),
        diastolic: 65 + Math.floor(Math.random() * 20),
        heartRate: 60 + Math.floor(Math.random() * 25),
        position: ['SITTING', 'LYING', 'STANDING'][Math.floor(Math.random() * 3)] as any,
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Add demo cognitive tests
  for (let i = 0; i < 10; i++) {
    const daysAgo = i * 3;
    await prisma.cognitiveTest.create({
      data: {
        userId: patient.id,
        testType: 'REACTION_TIME',
        score: 250 + Math.floor(Math.random() * 100),
        maxScore: 500,
        duration: 60,
        timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Add educational content
  const articles = [
    { title: 'Što je Moyamoya bolest?', body: 'Moyamoya bolest je kronična, progresivna cerebrovaskularna bolest karakterizirana stenozom ili okluzijom terminalnih dijelova unutarnje karotidne arterije...', category: 'basics', order: 1 },
    { title: 'Razumijevanje TIA simptoma', body: 'Tranzitorna ishemijska ataka (TIA) je privremeni poremećaj opskrbe mozga krvlju. Simptomi uključuju: slabost jedne strane tijela, poteškoće s govorom, promjene vida...', category: 'symptoms', order: 1 },
    { title: 'Zašto je hidratacija kritična', body: 'Dehidracija je jedan od najčešćih okidača za TIA kod moyamoya pacijenata. Smanjen volumen krvi dovodi do smanjene cerebralne perfuzije...', category: 'lifestyle', order: 1 },
    { title: 'Sigurno vježbanje s Moyamoyom', body: 'Vježba je važna za kardiovaskularno zdravlje, ali mora se pristupiti oprezno. Hiperventilacija uzrokuje vazokonstrikciju...', category: 'lifestyle', order: 2 },
    { title: 'Aspirin i Moyamoya', body: 'Aspirin je najčešće korišteni lijek u konzervativnom liječenju moyamoya bolesti. Smanjuje agregaciju trombocita u suženim cerebralnim žilama...', category: 'medications', order: 1 },
    { title: 'Priprema za posjet liječniku', body: 'Redoviti pregledi su ključni. Pripremite: popis simptoma, pitanja za liječnika, izvještaj iz aplikacije, popis lijekova...', category: 'appointments', order: 1 },
  ];

  for (const article of articles) {
    await prisma.educationalContent.create({
      data: { ...article, published: true, locale: 'hr' },
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
