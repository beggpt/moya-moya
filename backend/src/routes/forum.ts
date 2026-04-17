import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createNotification, notifyTopicSubscribers } from '../services/notifications';

const router = Router();
router.use(authMiddleware);

const CATEGORIES = ['GENERAL', 'SYMPTOMS', 'TREATMENT', 'SURGERY', 'PRE_SURGERY_SUPPORT', 'FRESHLY_DIAGNOSED', 'LIFESTYLE', 'MENTAL_HEALTH', 'CAREGIVERS', 'RESEARCH'] as const;

const topicSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(5000),
  category: z.enum(CATEGORIES).default('GENERAL'),
});

// List topics
router.get('/topics', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const category = req.query.category as string;

    const where: any = {};
    if (category && CATEGORIES.includes(category as any)) {
      where.category = category;
    }

    const [topics, total] = await Promise.all([
      prisma.forumTopic.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.forumTopic.count({ where }),
    ]);

    res.json({ topics, total, page });
  } catch (error) {
    console.error('Forum topics error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Get single topic with comments
router.get('/topics/:id', async (req: AuthRequest, res) => {
  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, image: true } },
            replies: {
              include: { user: { select: { id: true, name: true, image: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!topic) return res.status(404).json({ error: 'Tema nije pronađena' });
    res.json(topic);
  } catch (error) {
    console.error('Forum topic error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Create topic
router.post('/topics', async (req: AuthRequest, res) => {
  try {
    const data = topicSchema.parse(req.body);
    const topic = await prisma.forumTopic.create({
      data: { ...data, userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
    });

    // Auto-subscribe author to their topic
    await prisma.topicSubscription.create({
      data: { userId: req.user!.id, topicId: topic.id },
    }).catch(() => {});

    res.json(topic);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Add comment to topic
router.post('/topics/:id/comments', async (req: AuthRequest, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Komentar ne može biti prazan' });

    const topic = await prisma.forumTopic.findUnique({ where: { id: req.params.id } });
    if (!topic) return res.status(404).json({ error: 'Tema nije pronađena' });
    if (topic.locked) return res.status(403).json({ error: 'Tema je zaključana' });

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.user!.id,
        topicId: req.params.id,
        parentId: parentId || null,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    // Auto-subscribe commenter (silently ignore if already subscribed)
    await prisma.topicSubscription.create({
      data: { userId: req.user!.id, topicId: req.params.id },
    }).catch(() => {});

    // Notify all subscribers except the commenter
    await notifyTopicSubscribers(req.params.id, req.user!.id, comment.user.name || 'Someone', topic.title);

    res.json(comment);
  } catch (error) {
    console.error('Topic comment error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Subscribe to topic
router.post('/topics/:id/subscribe', async (req: AuthRequest, res) => {
  try {
    await prisma.topicSubscription.upsert({
      where: { userId_topicId: { userId: req.user!.id, topicId: req.params.id } },
      create: { userId: req.user!.id, topicId: req.params.id },
      update: {},
    });
    res.json({ subscribed: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Unsubscribe from topic
router.delete('/topics/:id/subscribe', async (req: AuthRequest, res) => {
  try {
    await prisma.topicSubscription.deleteMany({
      where: { userId: req.user!.id, topicId: req.params.id },
    });
    res.json({ subscribed: false });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Get subscription status
router.get('/topics/:id/subscription', async (req: AuthRequest, res) => {
  try {
    const sub = await prisma.topicSubscription.findUnique({
      where: { userId_topicId: { userId: req.user!.id, topicId: req.params.id } },
    });
    res.json({ subscribed: !!sub });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Delete topic (own or admin)
router.delete('/topics/:id', async (req: AuthRequest, res) => {
  try {
    const topic = await prisma.forumTopic.findUnique({ where: { id: req.params.id } });
    if (!topic) return res.status(404).json({ error: 'Tema nije pronađena' });
    if (topic.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Nemate dozvolu' });
    }
    await prisma.forumTopic.delete({ where: { id: req.params.id } });
    res.json({ message: 'Tema obrisana' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

export default router;
