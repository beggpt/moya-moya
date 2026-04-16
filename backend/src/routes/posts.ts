import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const postSchema = z.object({
  content: z.string().min(1).max(2000),
  image: z.string().optional().nullable(),
});

// Get feed (all posts, newest first — friends-first sorting later)
router.get('/feed', async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true, comments: true } },
          likes: {
            where: { userId: req.user!.id },
            select: { id: true },
          },
        },
      }),
      prisma.post.count(),
    ]);

    const feed = posts.map((p) => ({
      ...p,
      liked: p.likes.length > 0,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      likes: undefined,
      _count: undefined,
    }));

    res.json({ posts: feed, total, page });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Greška pri dohvaćanju objava' });
  }
});

// Create post
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = postSchema.parse(req.body);
    const post = await prisma.post.create({
      data: { ...data, userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    res.json({ ...post, liked: false, likesCount: 0, commentsCount: 0 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Objava mora imati sadržaj (max 2000 znakova)' });
    }
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Greška pri kreiranju objave' });
  }
});

// Delete own post
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Objava nije pronađena' });
    if (post.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Nemate dozvolu' });
    }
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ message: 'Objava obrisana' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Like / unlike
router.post('/:id/like', async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user!.id, postId: req.params.id } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: { userId: req.user!.id, postId: req.params.id },
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json(comments);
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Add comment to a post
router.post('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Komentar ne može biti prazan' });

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.user!.id,
        postId: req.params.id,
        parentId: parentId || null,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    res.json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

export default router;
