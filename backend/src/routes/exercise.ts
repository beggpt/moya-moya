import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Safety classifications for moyamoya patients
const ACTIVITY_SAFETY: Record<string, { safety: string; warning?: string }> = {
  'walking': { safety: 'SAFE' },
  'swimming': { safety: 'SAFE', warning: 'Izbjegavaj natjecateljsko plivanje i zadržavanje daha' },
  'cycling': { safety: 'SAFE', warning: 'Umjerenim tempom, izbjegavaj strme uspone' },
  'yoga': { safety: 'SAFE', warning: 'Izbjegavaj hot yoga i intenzivne vježbe disanja' },
  'tai_chi': { safety: 'SAFE' },
  'light_weights': { safety: 'CAUTION', warning: 'Izbjegavaj Valsalva manevar (zadržavanje daha pri dizanju)' },
  'running': { safety: 'CAUTION', warning: 'Samo lagano trčanje, prekini ako se pojavi teško disanje' },
  'hiit': { safety: 'AVOID', warning: 'Hiperventilacija može izazvati TIA' },
  'contact_sports': { safety: 'AVOID', warning: 'Rizik od traume glave s kompromitiranom cerebralnom vaskulaturom' },
  'scuba_diving': { safety: 'AVOID', warning: 'Strogo kontraindicirano - promjene tlaka i zadržavanje daha' },
  'competitive_sports': { safety: 'AVOID', warning: 'Intenzivni napor uzrokuje hiperventilaciju' },
  'heavy_weights': { safety: 'AVOID', warning: 'Valsalva manevar povećava intrakranijalni tlak' },
};

const exerciseSchema = z.object({
  activity: z.string().min(1),
  intensity: z.enum(['LOW', 'MODERATE', 'HIGH']),
  durationMin: z.number().min(1),
  heartRateAvg: z.number().optional().nullable(),
  heartRateMax: z.number().optional().nullable(),
  hydrated: z.boolean().default(true),
  symptoms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  timestamp: z.string().optional(),
});

// Get activity safety info
router.get('/safety', async (_req: AuthRequest, res) => {
  res.json(ACTIVITY_SAFETY);
});

// Get safety for specific activity
router.get('/safety/:activity', async (req: AuthRequest, res) => {
  const key = req.params.activity.toLowerCase().replace(/\s+/g, '_');
  const info = ACTIVITY_SAFETY[key];
  res.json(info || { safety: 'CAUTION', warning: 'Posavjetuj se s liječnikom o ovoj aktivnosti' });
});

// List exercise logs
router.get('/', async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', from, to } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { userId: req.user!.id };
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from as string);
    if (to) where.timestamp.lte = new Date(to as string);
  }

  const [logs, total] = await Promise.all([
    prisma.exerciseLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.exerciseLog.count({ where }),
  ]);

  res.json({ logs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// Add exercise log
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = exerciseSchema.parse(req.body);
    const key = data.activity.toLowerCase().replace(/\s+/g, '_');
    const safetyInfo = ACTIVITY_SAFETY[key] || { safety: 'CAUTION' };

    const log = await prisma.exerciseLog.create({
      data: {
        userId: req.user!.id,
        ...data,
        safety: safetyInfo.safety as any,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });

    res.json({ log, safety: safetyInfo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    res.status(500).json({ error: 'Greška' });
  }
});

// Stats
router.get('/stats/summary', async (req: AuthRequest, res) => {
  const { days = '30' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const logs = await prisma.exerciseLog.findMany({
    where: { userId: req.user!.id, timestamp: { gte: since } },
    orderBy: { timestamp: 'desc' },
  });

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMin, 0);
  const byActivity = logs.reduce((acc: any, l) => {
    acc[l.activity] = (acc[l.activity] || 0) + l.durationMin;
    return acc;
  }, {});

  res.json({
    totalSessions: logs.length,
    totalMinutes,
    avgMinutesPerSession: logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0,
    byActivity,
    withSymptoms: logs.filter((l) => l.symptoms).length,
  });
});

export default router;
