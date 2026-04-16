import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../services/email';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

// Register
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email je već registriran' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'PATIENT',
      },
    });

    const verifyToken = jwt.sign({ userId: user.id, type: 'verify' }, process.env.JWT_SECRET!, { expiresIn: '24h' });
    await sendVerificationEmail(email, verifyToken);

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, profile: null },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Greška pri registraciji' });
  }
});

// Login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Pogrešan email ili lozinka' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Greška pri prijavi' });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ error: 'Google auth neuspješan' });
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, image: payload.picture, emailVerified: true, lastLoginAt: new Date() },
        });
      } else {
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          googleId: payload.sub,
          name: payload.name,
          image: payload.picture,
          emailVerified: true,
          role: payload.email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'PATIENT',
          lastLoginAt: new Date(),
        },
      });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google auth neuspješan' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; type: string };
    if (decoded.type !== 'verify') {
      return res.status(400).json({ error: 'Nevažeći token' });
    }
    await prisma.user.update({ where: { id: decoded.userId }, data: { emailVerified: true } });
    res.json({ message: 'Email potvrđen' });
  } catch {
    res.status(400).json({ error: 'Nevažeći ili istekli token' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, name: true, role: true, image: true,
      locale: true, emailVerified: true, createdAt: true,
      profile: { select: { onboardingCompleted: true } },
    },
  });
  res.json(user);
});

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  const { name, image, locale } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, image, locale },
    select: { id: true, email: true, name: true, role: true, image: true, locale: true },
  });
  res.json(user);
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'Ako račun postoji, poslan je email za reset' });
    }
    const resetToken = jwt.sign({ userId: user.id, type: 'reset' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const { sendEmail } = await import('../services/email');
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail(email, 'Reset lozinke - MoyaMoya Companion', `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #0D9488;">MoyaMoya Companion</h1>
        <p>Klikni na link za reset lozinke:</p>
        <a href="${url}" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset lozinke</a>
        <p style="color: #78716C; font-size: 14px;">Link vrijedi 1 sat.</p>
      </div>
    `);
    res.json({ message: 'Ako račun postoji, poslan je email za reset' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Lozinka mora imati min 8 znakova' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; type: string };
    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: 'Nevažeći token' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: decoded.userId }, data: { passwordHash } });
    res.json({ message: 'Lozinka promijenjena' });
  } catch {
    res.status(400).json({ error: 'Nevažeći ili istekli token' });
  }
});

export default router;
