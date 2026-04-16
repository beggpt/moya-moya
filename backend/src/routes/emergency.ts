import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendSOSAlert } from '../services/email';

const router = Router();

// Public emergency card (no auth required)
router.get('/public/:userId', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
    select: {
      name: true,
      profile: {
        select: {
          dateOfBirth: true,
          gender: true,
          bloodType: true,
          allergies: true,
          moyamoyaType: true,
          suzukiStage: true,
          affectedSide: true,
          hadSurgery: true,
          surgeryType: true,
          emergencyContact: true,
          emergencyPhone: true,
          emergencyRelation: true,
          hospitalName: true,
          neurologistName: true,
          neurologistPhone: true,
        },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'Nije pronađeno' });

  const medications = await prisma.medication.findMany({
    where: { userId: req.params.userId, active: true },
    select: { name: true, dosage: true, unit: true, frequency: true },
  });

  res.json({
    condition: 'Moyamoya bolest',
    conditionEN: 'Moyamoya Disease',
    patient: user,
    medications,
    instructions: [
      'Ova osoba ima moyamoya bolest - kroničnu cerebrovaskularnu bolest',
      'U slučaju simptoma moždanog udara (slabost jedne strane, poteškoće s govorom, jaka glavobolja) ODMAH pozovite hitnu pomoć',
      'NE koristite vazokonstriktore (pseudoefedrin, triptani)',
      'Održavajte normalan krvni tlak - izbjegavajte i hipertenziju i hipotenziju',
      'Ako je potrebna anestezija: održavajte normokapniju, izbjegavajte hiperventilaciju i hipotenziju',
    ],
    instructionsEN: [
      'This person has Moyamoya disease - a chronic cerebrovascular condition',
      'In case of stroke symptoms (one-sided weakness, speech difficulty, severe headache) CALL EMERGENCY immediately',
      'Do NOT use vasoconstrictors (pseudoephedrine, triptans)',
      'Maintain normal blood pressure - avoid both hypertension and hypotension',
      'If anesthesia is needed: maintain normocapnia, avoid hyperventilation and hypotension',
    ],
    emergencyNumber: '194',
  });
});

// Protected routes
router.use(authMiddleware);

// Get own emergency card data
router.get('/card', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      profile: true,
      medications: { where: { active: true } },
    },
  });
  res.json(user);
});

// Update emergency card
router.put('/card', async (req: AuthRequest, res) => {
  const { emergencyContact, emergencyPhone, emergencyRelation, hospitalName, neurologistName, neurologistPhone } = req.body;
  const profile = await prisma.patientProfile.upsert({
    where: { userId: req.user!.id },
    update: { emergencyContact, emergencyPhone, emergencyRelation, hospitalName, neurologistName, neurologistPhone },
    create: { userId: req.user!.id, emergencyContact, emergencyPhone, emergencyRelation, hospitalName, neurologistName, neurologistPhone },
  });
  res.json(profile);
});

// Trigger SOS
router.post('/sos', async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });

    // Create SOS event
    const contactsNotified: string[] = [];

    // Notify emergency contact from profile
    if (user?.profile?.emergencyPhone) {
      contactsNotified.push(user.profile.emergencyPhone);
    }

    // Notify caregivers
    const caregiverLinks = await prisma.caregiverLink.findMany({
      where: { patientId: req.user!.id, accepted: true, permission: { in: ['READ_ALERTS', 'FULL_ACCESS'] } },
      include: { caregiver: true },
    });

    for (const link of caregiverLinks) {
      contactsNotified.push(link.caregiver.email);
      await sendSOSAlert(
        link.caregiver.email,
        user?.name || 'Pacijent',
        address || (latitude && longitude ? `${latitude}, ${longitude}` : undefined)
      );
    }

    const sosEvent = await prisma.sOSEvent.create({
      data: {
        userId: req.user!.id,
        latitude,
        longitude,
        address,
        contactsNotified,
      },
    });

    res.json({ sosEvent, notified: contactsNotified.length });
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({ error: 'Greška pri slanju SOS-a' });
  }
});

// Resolve SOS
router.post('/sos/:id/resolve', async (req: AuthRequest, res) => {
  const result = await prisma.sOSEvent.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { resolvedAt: new Date(), notes: req.body.notes },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Nije pronađeno' });
  res.json({ message: 'SOS razriješen' });
});

// SOS history
router.get('/sos/history', async (req: AuthRequest, res) => {
  const events = await prisma.sOSEvent.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  res.json(events);
});

export default router;
