import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// List notifications
router.get('/', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 30;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);

    res.json({ notifications, total, unreadCount, page });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// Unread count (cheap polling endpoint)
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Mark one as read
router.post('/:id/read', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { read: true, readAt: new Date() },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Mark all as read
router.post('/read-all', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
