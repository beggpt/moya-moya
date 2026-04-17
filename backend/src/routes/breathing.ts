import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const TECHNIQUES = ['BOX', 'FOUR_SEVEN_EIGHT', 'COHERENT'] as const;

const logSchema = z.object({
  technique: z.enum(TECHNIQUES),
  durationSec: z.number().min(1).max(3600),
  cyclesCount: z.number().min(0).max(1000),
  notes: z.string().optional().nullable(),
});

// List sessions
router.get('/', async (req: AuthRequest, res) => {
  try {
    const sessions = await prisma.breathingSession.findMany({
      where: { userId: req.user!.id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Stats: sessions + total minutes over last N days
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await prisma.breathingSession.findMany({
      where: { userId: req.user!.id, timestamp: { gte: since } },
    });

    const totalSec = sessions.reduce((s, x) => s + x.durationSec, 0);
    res.json({
      count: sessions.length,
      totalMinutes: Math.round(totalSec / 60),
      byTechnique: sessions.reduce((acc: any, s) => {
        acc[s.technique] = (acc[s.technique] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Log a completed session
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = logSchema.parse(req.body);
    const session = await prisma.breathingSession.create({
      data: { ...data, userId: req.user!.id },
    });
    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data' });
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
