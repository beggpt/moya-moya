import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const bpSchema = z.object({
  systolic: z.number().min(60).max(300),
  diastolic: z.number().min(30).max(200),
  heartRate: z.number().min(30).max(250).optional().nullable(),
  position: z.enum(['LYING', 'SITTING', 'STANDING']).optional().nullable(),
  arm: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  timestamp: z.string().optional(),
});

// List readings
router.get('/', async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', from, to } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { userId: req.user!.id };
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from as string);
    if (to) where.timestamp.lte = new Date(to as string);
  }

  const [readings, total] = await Promise.all([
    prisma.bPReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.bPReading.count({ where }),
  ]);

  res.json({ readings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// Add reading
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = bpSchema.parse(req.body);
    const reading = await prisma.bPReading.create({
      data: {
        userId: req.user!.id,
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      },
    });

    // Check against targets
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });
    let warning = null;
    if (profile) {
      if (profile.bpTargetSystolicMax && data.systolic > profile.bpTargetSystolicMax) {
        warning = 'Sistolički tlak je iznad ciljane vrijednosti';
      }
      if (profile.bpTargetDiastolicMax && data.diastolic > profile.bpTargetDiastolicMax) {
        warning = 'Dijastolički tlak je iznad ciljane vrijednosti';
      }
      if (profile.bpTargetSystolicMin && data.systolic < profile.bpTargetSystolicMin) {
        warning = 'Sistolički tlak je ispod ciljane vrijednosti - oprez!';
      }
    }

    res.json({ reading, warning });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    res.status(500).json({ error: 'Greška pri zapisivanju mjerenja' });
  }
});

// Delete reading
router.delete('/:id', async (req: AuthRequest, res) => {
  const result = await prisma.bPReading.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
  res.json({ message: 'Obrisano' });
});

// Stats
router.get('/stats/summary', async (req: AuthRequest, res) => {
  const { days = '30' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const [aggregates, readings, latest] = await Promise.all([
    prisma.bPReading.aggregate({
      where: { userId: req.user!.id, timestamp: { gte: since } },
      _avg: { systolic: true, diastolic: true, heartRate: true },
      _min: { systolic: true, diastolic: true },
      _max: { systolic: true, diastolic: true },
      _count: true,
    }),
    prisma.$queryRaw`
      SELECT DATE(timestamp) as date,
             AVG(systolic)::int as avg_systolic,
             AVG(diastolic)::int as avg_diastolic,
             AVG("heartRate")::int as avg_hr
      FROM "BPReading"
      WHERE "userId" = ${req.user!.id} AND timestamp >= ${since}
      GROUP BY DATE(timestamp)
      ORDER BY date
    ` as Promise<any[]>,
    prisma.bPReading.findFirst({
      where: { userId: req.user!.id },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  res.json({ aggregates, daily: readings, latest, totalReadings: aggregates._count });
});

export default router;
