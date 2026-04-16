import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const appointmentSchema = z.object({
  doctorName: z.string().min(1),
  specialty: z.string().min(1),
  date: z.string(),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  questions: z.string().optional().nullable(),
});

// List appointments
router.get('/', async (req: AuthRequest, res) => {
  const { upcoming, completed } = req.query;
  const where: any = { userId: req.user!.id };

  if (upcoming === 'true') {
    where.date = { gte: new Date() };
    where.completed = false;
  }
  if (completed === 'true') {
    where.completed = true;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { date: upcoming === 'true' ? 'asc' : 'desc' },
  });
  res.json(appointments);
});

// Create appointment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user!.id,
        ...data,
        date: new Date(data.date),
      },
    });
    res.json(appointment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    res.status(500).json({ error: 'Greška' });
  }
});

// Update appointment
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const data = appointmentSchema.partial().merge(
      z.object({ completed: z.boolean().optional(), summary: z.string().optional().nullable() })
    ).parse(req.body);

    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);

    const result = await prisma.appointment.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: updateData,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
    res.json({ message: 'Ažurirano' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci' });
    }
    res.status(500).json({ error: 'Greška' });
  }
});

// Delete appointment
router.delete('/:id', async (req: AuthRequest, res) => {
  const result = await prisma.appointment.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
  res.json({ message: 'Obrisano' });
});

// Pre-visit summary (auto-generated from recent data)
router.get('/:id/summary', async (req: AuthRequest, res) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!appointment) return res.status(404).json({ error: 'Nije pronađeno' });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [symptoms, bpStats, medAdherence, cogTests] = await Promise.all([
    prisma.symptomLog.findMany({
      where: { userId: req.user!.id, timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: 'desc' },
    }),
    prisma.bPReading.aggregate({
      where: { userId: req.user!.id, timestamp: { gte: thirtyDaysAgo } },
      _avg: { systolic: true, diastolic: true },
      _count: true,
    }),
    prisma.medReminder.findMany({
      where: {
        medication: { userId: req.user!.id, active: true },
        scheduledAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.cognitiveTest.findMany({
      where: { userId: req.user!.id, timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  const totalReminders = medAdherence.length;
  const takenReminders = medAdherence.filter((r) => r.takenAt).length;

  const summary = {
    period: '30 dana',
    symptoms: {
      total: symptoms.length,
      byType: symptoms.reduce((acc: any, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {}),
      emergencies: symptoms.filter((s) => s.wasEmergency).length,
    },
    bloodPressure: {
      avgSystolic: Math.round(bpStats._avg.systolic || 0),
      avgDiastolic: Math.round(bpStats._avg.diastolic || 0),
      readings: bpStats._count,
    },
    medicationAdherence: {
      rate: totalReminders > 0 ? Math.round((takenReminders / totalReminders) * 100) : 100,
      total: totalReminders,
      taken: takenReminders,
    },
    cognitiveTests: cogTests.length,
    questions: appointment.questions,
  };

  res.json(summary);
});

export default router;
