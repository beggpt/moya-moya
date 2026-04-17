import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createNotification } from '../services/notifications';

const router = Router();
router.use(authMiddleware);

// List my conversations with last message + unread count
router.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const memberships = await prisma.conversationParticipant.findMany({
      where: { userId: req.user!.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const result = await Promise.all(
      memberships.map(async (m) => {
        const otherParticipants = m.conversation.participants
          .filter((p) => p.userId !== req.user!.id)
          .map((p) => p.user);

        // Unread count: messages after my lastReadAt, not authored by me
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: m.conversationId,
            userId: { not: req.user!.id },
            ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
          },
        });

        return {
          id: m.conversation.id,
          isGroup: m.conversation.isGroup,
          title: m.conversation.title,
          otherParticipants,
          lastMessage: m.conversation.messages[0] || null,
          unreadCount,
          updatedAt: m.conversation.updatedAt,
        };
      }),
    );

    res.json(result);
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Total unread count (for sidebar badge)
router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const memberships = await prisma.conversationParticipant.findMany({
      where: { userId: req.user!.id },
      select: { conversationId: true, lastReadAt: true },
    });
    let count = 0;
    for (const m of memberships) {
      count += await prisma.message.count({
        where: {
          conversationId: m.conversationId,
          userId: { not: req.user!.id },
          ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
        },
      });
    }
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// Start (or find existing) 1-on-1 conversation with another user
router.post('/conversations/direct', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (userId === req.user!.id) return res.status(400).json({ error: "Can't message yourself" });

    // Look for existing 1-on-1 conversation with both participants
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: req.user!.id } } },
          { participants: { some: { userId } } },
        ],
      },
      include: { participants: true },
    });

    if (existing && existing.participants.length === 2) {
      return res.json({ id: existing.id });
    }

    // Create new 1-on-1
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: req.user!.id }, { userId }],
        },
      },
    });
    res.json({ id: conversation.id });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Create group conversation
router.post('/conversations/group', async (req: AuthRequest, res) => {
  try {
    const { title, userIds } = req.body;
    if (!title || !Array.isArray(userIds) || userIds.length < 1) {
      return res.status(400).json({ error: 'title and userIds required' });
    }

    const uniqueIds = Array.from(new Set([...userIds, req.user!.id]));
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        title: title.trim().slice(0, 100),
        participants: { create: uniqueIds.map((id: string) => ({ userId: id })) },
      },
    });
    res.json({ id: conversation.id });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Get messages in a conversation
router.get('/conversations/:id/messages', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    // Verify participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: req.params.id, userId: req.user!.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const [messages, conversation] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      prisma.conversation.findUnique({
        where: { id: req.params.id },
        include: {
          participants: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
      }),
    ]);

    res.json({
      conversation,
      messages: messages.reverse(), // oldest first for chat UI
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

const sendSchema = z.object({ content: z.string().min(1).max(2000) });

// Send message
router.post('/conversations/:id/messages', async (req: AuthRequest, res) => {
  try {
    const { content } = sendSchema.parse(req.body);

    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: req.params.id, userId: req.user!.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        userId: req.user!.id,
        content: content.trim(),
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    // Bump conversation updatedAt + mark my lastReadAt
    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: req.params.id, userId: req.user!.id } },
      data: { lastReadAt: new Date() },
    });

    // Notify other participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: req.params.id, userId: { not: req.user!.id } },
    });
    const sender = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      select: { isGroup: true, title: true },
    });

    await Promise.all(
      otherParticipants.map((p) =>
        createNotification({
          userId: p.userId,
          type: 'NEW_MESSAGE',
          title: conversation?.isGroup ? `${sender?.name || 'Someone'} in ${conversation.title}` : `${sender?.name || 'Someone'}`,
          body: content.length > 80 ? content.slice(0, 80) + '…' : content,
          data: { conversationId: req.params.id },
        }),
      ),
    );

    res.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid message' });
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Error' });
  }
});

// Mark as read
router.post('/conversations/:id/read', async (req: AuthRequest, res) => {
  try {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: req.params.id, userId: req.user!.id },
      data: { lastReadAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

export default router;
