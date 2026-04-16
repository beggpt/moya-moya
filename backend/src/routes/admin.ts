import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard KPIs
router.get('/dashboard', async (_req: AuthRequest, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsersWeek, totalSymptoms, symptomsMonth,
    emergencyEvents, activePatients, totalMeds, totalBP,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.user.count({ where: { role: 'PATIENT', createdAt: { gte: weekAgo } } }),
    prisma.symptomLog.count(),
    prisma.symptomLog.count({ where: { timestamp: { gte: monthAgo } } }),
    prisma.sOSEvent.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { role: 'PATIENT', lastLoginAt: { gte: weekAgo } } }),
    prisma.medication.count({ where: { active: true } }),
    prisma.bPReading.count({ where: { timestamp: { gte: monthAgo } } }),
  ]);

  res.json({
    totalUsers,
    newUsersWeek,
    totalSymptoms,
    symptomsMonth,
    emergencyEvents,
    activePatients,
    totalMeds,
    totalBP,
  });
});

// All users (paginated, filterable)
router.get('/users', async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', search, role, sort = 'createdAt', order = 'desc' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sort as string]: order },
      skip,
      take: Number(limit),
      select: {
        id: true, email: true, name: true, role: true, image: true,
        lastLoginAt: true, createdAt: true, emailVerified: true,
        profile: {
          select: {
            moyamoyaType: true, suzukiStage: true, affectedSide: true,
            dateOfBirth: true, hadSurgery: true, onboardingCompleted: true,
          },
        },
        _count: {
          select: {
            symptoms: true, medications: true, bpReadings: true,
            cognitiveTests: true, appointments: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// Full user detail
router.get('/users/:id', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      profile: true,
      symptoms: { orderBy: { timestamp: 'desc' }, take: 50 },
      medications: { include: { reminders: { orderBy: { scheduledAt: 'desc' }, take: 30 } } },
      bpReadings: { orderBy: { timestamp: 'desc' }, take: 50 },
      cognitiveTests: { orderBy: { timestamp: 'desc' }, take: 30 },
      appointments: { orderBy: { date: 'desc' }, take: 20 },
      exerciseLogs: { orderBy: { timestamp: 'desc' }, take: 20 },
      sosEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      caregivers: { include: { caregiver: { select: { id: true, name: true, email: true } } } },
      caregiverFor: { include: { patient: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });
  res.json(user);
});

// Update admin notes on patient
router.put('/users/:id/notes', async (req: AuthRequest, res) => {
  const { notes } = req.body;
  const profile = await prisma.patientProfile.upsert({
    where: { userId: req.params.id },
    update: { adminNotes: notes },
    create: { userId: req.params.id, adminNotes: notes },
  });
  res.json(profile);
});

// Update user role
router.put('/users/:id/role', async (req: AuthRequest, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'PATIENT', 'CAREGIVER'].includes(role)) {
    return res.status(400).json({ error: 'Nevažeća uloga' });
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });
  res.json(user);
});

// Export user data (CSV format)
router.get('/users/:id/export', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      profile: true,
      symptoms: { orderBy: { timestamp: 'asc' } },
      bpReadings: { orderBy: { timestamp: 'asc' } },
      medications: true,
    },
  });

  if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });

  let csv = 'Sekcija,Datum,Tip,Vrijednost,Detalji\n';

  user.symptoms.forEach((s) => {
    csv += `Simptom,${s.timestamp.toISOString()},${s.type},Ozbiljnost: ${s.severity},"${s.notes || ''}"\n`;
  });

  user.bpReadings.forEach((r) => {
    csv += `Krvni tlak,${r.timestamp.toISOString()},${r.position || '-'},${r.systolic}/${r.diastolic},"HR: ${r.heartRate || '-'}"\n`;
  });

  user.medications.forEach((m) => {
    csv += `Lijek,${m.startDate.toISOString()},${m.name},${m.dosage}${m.unit},"${m.frequency}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=patient-${user.name || user.id}-export.csv`);
  res.send('\uFEFF' + csv); // BOM for Excel UTF-8
});

// Aggregate analytics
router.get('/analytics', async (req: AuthRequest, res) => {
  const { days = '30' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const [
    symptomsByType, symptomsByDay, usersByMonth,
    avgBP, surgeryStats, stageDistribution,
  ] = await Promise.all([
    prisma.symptomLog.groupBy({
      by: ['type'],
      where: { timestamp: { gte: since } },
      _count: true,
    }),
    prisma.$queryRaw`
      SELECT DATE(timestamp) as date, COUNT(*)::int as count
      FROM "SymptomLog" WHERE timestamp >= ${since}
      GROUP BY DATE(timestamp) ORDER BY date
    ` as Promise<any[]>,
    prisma.$queryRaw`
      SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
      FROM "User" WHERE role = 'PATIENT'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM') ORDER BY month
    ` as Promise<any[]>,
    prisma.bPReading.aggregate({
      where: { timestamp: { gte: since } },
      _avg: { systolic: true, diastolic: true },
    }),
    prisma.patientProfile.groupBy({
      by: ['hadSurgery'],
      _count: true,
    }),
    prisma.patientProfile.groupBy({
      by: ['suzukiStage'],
      where: { suzukiStage: { not: null } },
      _count: true,
    }),
  ]);

  res.json({
    symptomsByType, symptomsByDay, usersByMonth,
    avgBP: avgBP._avg, surgeryStats, stageDistribution,
  });
});

// Manage educational content
router.get('/content', async (_req: AuthRequest, res) => {
  const content = await prisma.educationalContent.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  res.json(content);
});

router.post('/content', async (req: AuthRequest, res) => {
  const { title, body, category, locale = 'hr', order = 0 } = req.body;
  const content = await prisma.educationalContent.create({
    data: { title, body, category, locale, order },
  });
  res.json(content);
});

router.put('/content/:id', async (req: AuthRequest, res) => {
  const { title, body, category, locale, order, published } = req.body;
  const content = await prisma.educationalContent.update({
    where: { id: req.params.id },
    data: { title, body, category, locale, order, published },
  });
  res.json(content);
});

router.delete('/content/:id', async (_req: AuthRequest, res) => {
  await prisma.educationalContent.delete({ where: { id: _req.params.id } });
  res.json({ message: 'Obrisano' });
});

export default router;
