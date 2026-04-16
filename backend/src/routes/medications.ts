import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  unit: z.string().default('mg'),
  frequency: z.string(),
  timesOfDay: z.array(z.string()).default([]),
  instructions: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
});

// List active medications
router.get('/', async (req: AuthRequest, res) => {
  const { active } = req.query;
  const where: any = { userId: req.user!.id };
  if (active !== undefined) where.active = active === 'true';

  const medications = await prisma.medication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      reminders: {
        where: { scheduledAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      },
    },
  });
  res.json(medications);
});

// Add medication
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = medicationSchema.parse(req.body);
    const medication = await prisma.medication.create({
      data: {
        userId: req.user!.id,
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
    res.json(medication);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    res.status(500).json({ error: 'Greška pri dodavanju lijeka' });
  }
});

// Update medication
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = medicationSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const medication = await prisma.medication.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: updateData,
    });
    if (medication.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
    res.json({ message: 'Ažurirano' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci' });
    }
    res.status(500).json({ error: 'Greška' });
  }
});

// Deactivate medication
router.delete('/:id', async (req: AuthRequest, res) => {
  const result = await prisma.medication.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { active: false, endDate: new Date() },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
  res.json({ message: 'Lijek deaktiviran' });
});

// Mark reminder as taken
router.post('/:id/taken', async (req: AuthRequest, res) => {
  const med = await prisma.medication.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!med) return res.status(404).json({ error: 'Lijek nije pronađen' });

  const reminder = await prisma.medReminder.create({
    data: {
      medicationId: req.params.id,
      scheduledAt: new Date(),
      takenAt: new Date(),
    },
  });
  res.json(reminder);
});

// Skip reminder
router.post('/:id/skip', async (req: AuthRequest, res) => {
  const med = await prisma.medication.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!med) return res.status(404).json({ error: 'Lijek nije pronađen' });

  const reminder = await prisma.medReminder.create({
    data: {
      medicationId: req.params.id,
      scheduledAt: new Date(),
      skipped: true,
      skipReason: req.body.reason || null,
    },
  });
  res.json(reminder);
});

// Adherence stats
router.get('/stats/adherence', async (req: AuthRequest, res) => {
  const { days = '30' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const meds = await prisma.medication.findMany({
    where: { userId: req.user!.id, active: true },
    include: {
      reminders: {
        where: { scheduledAt: { gte: since } },
      },
    },
  });

  const stats = meds.map((med) => {
    const total = med.reminders.length;
    const taken = med.reminders.filter((r) => r.takenAt).length;
    const skipped = med.reminders.filter((r) => r.skipped).length;
    return {
      medicationId: med.id,
      name: med.name,
      dosage: med.dosage,
      total,
      taken,
      skipped,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 100,
    };
  });

  const overallRate = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.adherenceRate, 0) / stats.length)
    : 100;

  res.json({ medications: stats, overallRate });
});

export default router;
