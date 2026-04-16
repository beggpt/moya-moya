import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const symptomSchema = z.object({
  type: z.enum(['TIA', 'HEADACHE', 'WEAKNESS', 'NUMBNESS', 'SPEECH_DIFFICULTY', 'VISION_CHANGE', 'SEIZURE', 'DIZZINESS', 'CONFUSION', 'BALANCE_LOSS', 'OTHER']),
  severity: z.number().min(1).max(10),
  durationMin: z.number().optional().nullable(),
  bodyArea: z.string().optional().nullable(),
  trigger: z.string().optional().nullable(),
  activity: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  wasEmergency: z.boolean().optional(),
  timestamp: z.string().optional(),
});

// List symptoms
router.get('/', async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', type, from, to } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { userId: req.user!.id };
  if (type) where.type = type;
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from as string);
    if (to) where.timestamp.lte = new Date(to as string);
  }

  const [symptoms, total] = await Promise.all([
    prisma.symptomLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.symptomLog.count({ where }),
  ]);

  res.json({ symptoms, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// Quick log (minimal data)
router.post('/quick', async (req: AuthRequest, res) => {
  try {
    const { type, severity = 5 } = req.body;
    const symptom = await prisma.symptomLog.create({
      data: {
        userId: req.user!.id,
        type,
        severity,
      },
    });
    res.json(symptom);
  } catch (error) {
    console.error('Quick log error:', error);
    res.status(500).json({ error: 'Greška pri logiranju' });
  }
});

// Detailed log
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = symptomSchema.parse(req.body);
    const symptom = await prisma.symptomLog.create({
      data: {
        userId: req.user!.id,
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });

    // Notify caregivers if emergency
    if (data.wasEmergency) {
      const links = await prisma.caregiverLink.findMany({
        where: { patientId: req.user!.id, accepted: true, permission: { in: ['READ_ALERTS', 'FULL_ACCESS'] } },
        include: { caregiver: true },
      });
      // TODO: send notifications to caregivers
    }

    res.json(symptom);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    console.error('Symptom log error:', error);
    res.status(500).json({ error: 'Greška pri logiranju simptoma' });
  }
});

// Get single
router.get('/:id', async (req: AuthRequest, res) => {
  const symptom = await prisma.symptomLog.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!symptom) return res.status(404).json({ error: 'Nije pronađeno' });
  res.json(symptom);
});

// Update
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = symptomSchema.partial().parse(req.body);
    const symptom = await prisma.symptomLog.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      },
    });
    if (symptom.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
    res.json({ message: 'Ažurirano' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci' });
    }
    res.status(500).json({ error: 'Greška' });
  }
});

// Delete
router.delete('/:id', async (req: AuthRequest, res) => {
  const result = await prisma.symptomLog.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
  res.json({ message: 'Obrisano' });
});

// Stats for charts
router.get('/stats/summary', async (req: AuthRequest, res) => {
  const { days = '30' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const [byType, byDay, total, avgSeverity] = await Promise.all([
    prisma.symptomLog.groupBy({
      by: ['type'],
      where: { userId: req.user!.id, timestamp: { gte: since } },
      _count: true,
      _avg: { severity: true },
    }),
    prisma.$queryRaw`
      SELECT DATE(timestamp) as date, COUNT(*)::int as count
      FROM "SymptomLog"
      WHERE "userId" = ${req.user!.id} AND timestamp >= ${since}
      GROUP BY DATE(timestamp)
      ORDER BY date
    ` as Promise<any[]>,
    prisma.symptomLog.count({
      where: { userId: req.user!.id, timestamp: { gte: since } },
    }),
    prisma.symptomLog.aggregate({
      where: { userId: req.user!.id, timestamp: { gte: since } },
      _avg: { severity: true },
    }),
  ]);

  res.json({ byType, byDay, total, avgSeverity: avgSeverity._avg.severity });
});

export default router;
