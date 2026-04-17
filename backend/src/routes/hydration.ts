import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const DEFAULT_GOAL_ML = 2500;

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Today's intake + goal
router.get('/today', async (req: AuthRequest, res) => {
  try {
    const logs = await prisma.hydrationLog.findMany({
      where: {
        userId: req.user!.id,
        timestamp: { gte: startOfDay(), lte: endOfDay() },
      },
      orderBy: { timestamp: 'desc' },
    });
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
      select: { dailyWaterGoalMl: true, weight: true },
    });

    // If no custom goal, estimate from weight (30ml/kg), fallback to 2500ml
    const goal = profile?.dailyWaterGoalMl
      ?? (profile?.weight ? Math.round(profile.weight * 30 / 50) * 50 : DEFAULT_GOAL_ML);

    const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);

    res.json({ totalMl, goalMl: goal, percentage: Math.round((totalMl / goal) * 100), logs });
  } catch (error) {
    console.error('Hydration today error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Log water intake
const logSchema = z.object({ amountMl: z.number().min(1).max(5000) });

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { amountMl } = logSchema.parse(req.body);
    const log = await prisma.hydrationLog.create({
      data: { userId: req.user!.id, amountMl },
    });
    res.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid amount' });
    res.status(500).json({ error: 'Error' });
  }
});

// Delete a log entry
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.hydrationLog.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Stats: last N days
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 7, 90);
    const since = startOfDay();
    since.setDate(since.getDate() - days + 1);

    const logs = await prisma.hydrationLog.findMany({
      where: { userId: req.user!.id, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
    });

    // Group by day
    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const l of logs) {
      const key = new Date(l.timestamp).toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + l.amountMl;
    }

    const series = Object.entries(byDay).map(([date, ml]) => ({ date, ml }));
    res.json({ series, days });
  } catch (error) {
    console.error('Hydration stats error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Update daily goal
router.put('/goal', async (req: AuthRequest, res) => {
  try {
    const { goalMl } = req.body;
    if (typeof goalMl !== 'number' || goalMl < 500 || goalMl > 8000) {
      return res.status(400).json({ error: 'Goal must be between 500 and 8000 ml' });
    }
    await prisma.patientProfile.upsert({
      where: { userId: req.user!.id },
      update: { dailyWaterGoalMl: goalMl },
      create: { userId: req.user!.id, dailyWaterGoalMl: goalMl },
    });
    res.json({ goalMl });
  } catch (error) {
    console.error('Hydration goal error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
