import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get my friends (accepted)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, accepted: true },
          { receiverId: userId, accepted: true },
        ],
      },
      include: {
        requester: {
          select: { id: true, name: true, image: true, email: true, profile: { select: { moyamoyaType: true, suzukiStage: true, affectedSide: true, diagnosisDate: true } } },
        },
        receiver: {
          select: { id: true, name: true, image: true, email: true, profile: { select: { moyamoyaType: true, suzukiStage: true, affectedSide: true, diagnosisDate: true } } },
        },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.requesterId === userId ? f.receiver : f.requester;
      return { ...friend, friendshipId: f.id, since: f.createdAt };
    });

    res.json(friends);
  } catch (error) {
    console.error('Friends error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Get pending requests (received)
router.get('/requests', async (req: AuthRequest, res) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { receiverId: req.user!.id, accepted: false },
      include: {
        requester: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    console.error('Friend requests error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Search users (for adding friends)
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user!.id },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, name: true, image: true, email: true,
        profile: { select: { moyamoyaType: true, suzukiStage: true } },
      },
      take: 20,
    });

    // Check existing friendship status
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: users.flatMap((u) => [
          { requesterId: req.user!.id, receiverId: u.id },
          { requesterId: u.id, receiverId: req.user!.id },
        ]),
      },
    });

    const result = users.map((u) => {
      const friendship = friendships.find(
        (f) => (f.requesterId === u.id || f.receiverId === u.id)
      );
      return {
        ...u,
        friendshipStatus: friendship
          ? friendship.accepted ? 'friends' : friendship.requesterId === req.user!.id ? 'pending_sent' : 'pending_received'
          : 'none',
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Send friend request
router.post('/request', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Nedostaje userId' });
    if (userId === req.user!.id) return res.status(400).json({ error: 'Ne možete dodati sami sebe' });

    // Check existing
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user!.id, receiverId: userId },
          { requesterId: userId, receiverId: req.user!.id },
        ],
      },
    });
    if (existing) {
      if (existing.accepted) return res.status(400).json({ error: 'Već ste prijatelji' });
      return res.status(400).json({ error: 'Zahtjev već postoji' });
    }

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.user!.id, receiverId: userId },
    });
    res.json(friendship);
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Accept friend request
router.post('/:id/accept', async (req: AuthRequest, res) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!friendship) return res.status(404).json({ error: 'Zahtjev nije pronađen' });
    if (friendship.receiverId !== req.user!.id) return res.status(403).json({ error: 'Nemate dozvolu' });

    const updated = await prisma.friendship.update({
      where: { id: req.params.id },
      data: { accepted: true },
    });
    res.json(updated);
  } catch (error) {
    console.error('Accept friend error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Decline / remove friend
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
    if (!friendship) return res.status(404).json({ error: 'Nije pronađeno' });
    if (friendship.requesterId !== req.user!.id && friendship.receiverId !== req.user!.id) {
      return res.status(403).json({ error: 'Nemate dozvolu' });
    }
    await prisma.friendship.delete({ where: { id: req.params.id } });
    res.json({ message: 'Uklonjeno' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Get user public profile
router.get('/user/:id', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, image: true, createdAt: true,
        profile: {
          select: {
            moyamoyaType: true, suzukiStage: true, affectedSide: true,
            diagnosisDate: true, hadSurgery: true, surgeryType: true,
          },
        },
        _count: { select: { posts: true, symptoms: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' });

    // Check friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user!.id, receiverId: req.params.id },
          { requesterId: req.params.id, receiverId: req.user!.id },
        ],
      },
    });

    res.json({
      ...user,
      friendshipStatus: friendship
        ? friendship.accepted ? 'friends' : friendship.requesterId === req.user!.id ? 'pending_sent' : 'pending_received'
        : 'none',
      friendshipId: friendship?.id,
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

export default router;
