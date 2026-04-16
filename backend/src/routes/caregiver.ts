import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendCaregiverInvite } from '../services/email';

const router = Router();
router.use(authMiddleware);

// Send invite
router.post('/invite', async (req: AuthRequest, res) => {
  try {
    const { email, permission = 'READ_ONLY' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email je obavezan' });

    // Check if caregiver already exists
    let caregiver = await prisma.user.findUnique({ where: { email } });

    if (caregiver) {
      const existing = await prisma.caregiverLink.findUnique({
        where: { caregiverId_patientId: { caregiverId: caregiver.id, patientId: req.user!.id } },
      });
      if (existing) return res.status(400).json({ error: 'Ova osoba je već vaš skrbnik' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    if (caregiver) {
      await prisma.caregiverLink.create({
        data: {
          caregiverId: caregiver.id,
          patientId: req.user!.id,
          permission: permission as any,
          inviteToken,
          accepted: false,
        },
      });
    } else {
      // Create placeholder - will be linked when they register
      caregiver = await prisma.user.create({
        data: { email, role: 'CAREGIVER' },
      });
      await prisma.caregiverLink.create({
        data: {
          caregiverId: caregiver.id,
          patientId: req.user!.id,
          permission: permission as any,
          inviteToken,
          accepted: false,
        },
      });
    }

    await sendCaregiverInvite(email, req.user!.name || 'Pacijent', inviteToken);
    res.json({ message: 'Pozivnica poslana' });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Greška pri slanju pozivnice' });
  }
});

// Accept invite
router.post('/accept', async (req: AuthRequest, res) => {
  try {
    const { token } = req.body;
    const link = await prisma.caregiverLink.findUnique({ where: { inviteToken: token } });
    if (!link) return res.status(404).json({ error: 'Pozivnica nije pronađena' });
    if (link.accepted) return res.status(400).json({ error: 'Pozivnica je već prihvaćena' });

    await prisma.caregiverLink.update({
      where: { id: link.id },
      data: { accepted: true, caregiverId: req.user!.id, inviteToken: null },
    });

    // Update user role if not already caregiver
    if (req.user!.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { role: 'CAREGIVER' },
      });
    }

    res.json({ message: 'Pozivnica prihvaćena' });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Greška' });
  }
});

// List my patients (as caregiver)
router.get('/patients', async (req: AuthRequest, res) => {
  const links = await prisma.caregiverLink.findMany({
    where: { caregiverId: req.user!.id, accepted: true },
    include: {
      patient: {
        select: {
          id: true, name: true, image: true,
          profile: { select: { moyamoyaType: true, suzukiStage: true, affectedSide: true } },
        },
      },
    },
  });
  res.json(links);
});

// Get patient data (as caregiver)
router.get('/patients/:patientId', async (req: AuthRequest, res) => {
  const link = await prisma.caregiverLink.findUnique({
    where: { caregiverId_patientId: { caregiverId: req.user!.id, patientId: req.params.patientId } },
  });
  if (!link || !link.accepted) return res.status(403).json({ error: 'Nemate pristup' });

  const patient = await prisma.user.findUnique({
    where: { id: req.params.patientId },
    include: {
      profile: true,
      symptoms: { orderBy: { timestamp: 'desc' }, take: 20 },
      medications: { where: { active: true } },
      bpReadings: { orderBy: { timestamp: 'desc' }, take: 10 },
      cognitiveTests: { orderBy: { timestamp: 'desc' }, take: 10 },
      appointments: { where: { completed: false }, orderBy: { date: 'asc' }, take: 5 },
    },
  });

  res.json(patient);
});

// Update permission
router.put('/:linkId', async (req: AuthRequest, res) => {
  const { permission } = req.body;
  const link = await prisma.caregiverLink.findFirst({
    where: { id: req.params.linkId, patientId: req.user!.id },
  });
  if (!link) return res.status(404).json({ error: 'Nije pronađeno' });

  await prisma.caregiverLink.update({
    where: { id: req.params.linkId },
    data: { permission },
  });
  res.json({ message: 'Dozvole ažurirane' });
});

// Remove caregiver
router.delete('/:linkId', async (req: AuthRequest, res) => {
  const link = await prisma.caregiverLink.findFirst({
    where: {
      id: req.params.linkId,
      OR: [{ patientId: req.user!.id }, { caregiverId: req.user!.id }],
    },
  });
  if (!link) return res.status(404).json({ error: 'Nije pronađeno' });

  await prisma.caregiverLink.delete({ where: { id: req.params.linkId } });
  res.json({ message: 'Skrbnik uklonjen' });
});

// List my caregivers (as patient)
router.get('/my-caregivers', async (req: AuthRequest, res) => {
  const links = await prisma.caregiverLink.findMany({
    where: { patientId: req.user!.id },
    include: {
      caregiver: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  res.json(links);
});

export default router;
