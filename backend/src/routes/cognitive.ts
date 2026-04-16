import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const testSchema = z.object({
  testType: z.enum(['REACTION_TIME', 'MEMORY_RECALL', 'PATTERN_MATCH', 'WORD_FLUENCY', 'DIGIT_SPAN', 'STROOP']),
  score: z.number(),
  maxScore: z.number().optional().nullable(),
  duration: z.number(),
  details: z.string().optional().nullable(),
});

// List test results
router.get('/', async (req: AuthRequest, res) => {
  const { testType, limit = '50' } = req.query;
  const where: any = { userId: req.user!.id };
  if (testType) where.testType = testType;

  const tests = await prisma.cognitiveTest.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: Number(limit),
  });
  res.json(tests);
});

// Submit test result
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = testSchema.parse(req.body);
    const test = await prisma.cognitiveTest.create({
      data: { userId: req.user!.id, ...data },
    });

    // Get baseline for comparison
    const baseline = await prisma.cognitiveTest.findFirst({
      where: { userId: req.user!.id, testType: data.testType },
      orderBy: { timestamp: 'asc' },
    });

    const previous = await prisma.cognitiveTest.findFirst({
      where: { userId: req.user!.id, testType: data.testType, id: { not: test.id } },
      orderBy: { timestamp: 'desc' },
    });

    let comparison = null;
    if (previous) {
      const change = ((data.score - previous.score) / previous.score) * 100;
      comparison = {
        previousScore: previous.score,
        change: Math.round(change * 10) / 10,
        trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      };
    }

    res.json({ test, comparison, baseline: baseline ? { score: baseline.score, date: baseline.timestamp } : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    res.status(500).json({ error: 'Greška' });
  }
});

// Stats/trends
router.get('/stats/trends', async (req: AuthRequest, res) => {
  const { days = '90' } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const tests = await prisma.cognitiveTest.findMany({
    where: { userId: req.user!.id, timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });

  const byType: Record<string, any[]> = {};
  for (const test of tests) {
    if (!byType[test.testType]) byType[test.testType] = [];
    byType[test.testType].push({
      score: test.score,
      maxScore: test.maxScore,
      date: test.timestamp,
      duration: test.duration,
    });
  }

  res.json(byType);
});

export default router;
