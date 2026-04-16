import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string | null;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nije pronađen' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Korisnik ne postoji' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Nevažeći token' });
  }
};

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Nemate pristup' });
  }
  next();
};

export const caregiverOrOwnerMiddleware = (patientIdParam: string = 'patientId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const patientId = req.params[patientIdParam] || userId;

    if (req.user!.role === 'ADMIN') return next();
    if (userId === patientId) return next();

    const link = await prisma.caregiverLink.findUnique({
      where: {
        caregiverId_patientId: { caregiverId: userId, patientId },
      },
    });

    if (!link || !link.accepted) {
      return res.status(403).json({ error: 'Nemate pristup podacima ovog pacijenta' });
    }

    next();
  };
};
