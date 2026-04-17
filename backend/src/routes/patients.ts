import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const profileSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  height: z.number().optional().nullable(),
  weight: z.number().optional().nullable(),
  diagnosisDate: z.string().optional().nullable(),
  moyamoyaType: z.enum(['DISEASE', 'SYNDROME']).optional().nullable(),
  suzukiStage: z.number().min(1).max(6).optional().nullable(),
  affectedSide: z.enum(['LEFT', 'RIGHT', 'BILATERAL']).optional().nullable(),
  underlyingCondition: z.string().optional().nullable(),
  hadSurgery: z.boolean().optional(),
  surgeryType: z.string().optional().nullable(),
  surgeryDate: z.string().optional().nullable(),
  surgeryDateLeft: z.string().optional().nullable(),
  surgeryDateRight: z.string().optional().nullable(),
  surgeryNotes: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  otherConditions: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  emergencyRelation: z.string().optional().nullable(),
  hospitalName: z.string().optional().nullable(),
  neurologistName: z.string().optional().nullable(),
  neurologistPhone: z.string().optional().nullable(),
  bpTargetSystolicMin: z.number().optional().nullable(),
  bpTargetSystolicMax: z.number().optional().nullable(),
  bpTargetDiastolicMin: z.number().optional().nullable(),
  bpTargetDiastolicMax: z.number().optional().nullable(),
});

// Get profile
router.get('/profile', async (req: AuthRequest, res) => {
  let profile = await prisma.patientProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (!profile) {
    profile = await prisma.patientProfile.create({
      data: { userId: req.user!.id },
    });
  }
  res.json(profile);
});

// Update profile
router.put('/profile', async (req: AuthRequest, res) => {
  try {
    const data = profileSchema.parse(req.body);
    const updateData: any = {};
    for (const [key, val] of Object.entries(data)) {
      updateData[key] = val === '' ? null : val;
    }

    const dateFields = ['dateOfBirth', 'diagnosisDate', 'surgeryDate', 'surgeryDateLeft', 'surgeryDateRight'];
    for (const field of dateFields) {
      if (updateData[field]) updateData[field] = new Date(updateData[field]);
      else if (field in updateData) updateData[field] = null;
    }

    const profile = await prisma.patientProfile.upsert({
      where: { userId: req.user!.id },
      update: updateData,
      create: { userId: req.user!.id, ...updateData },
    });
    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Nevažeći podaci', details: error.errors });
    }
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Greška pri ažuriranju profila' });
  }
});

// Complete onboarding
router.post('/onboarding', async (req: AuthRequest, res) => {
  try {
    const { profile: profileData, medications } = req.body;

    // Clean empty strings → null for all fields
    const updateData: any = { onboardingCompleted: true };
    for (const [key, val] of Object.entries(profileData)) {
      updateData[key] = val === '' ? null : val;
    }

    // Convert date strings to Date objects
    const dateFields = ['dateOfBirth', 'diagnosisDate', 'surgeryDate', 'surgeryDateLeft', 'surgeryDateRight'];
    for (const field of dateFields) {
      if (updateData[field]) updateData[field] = new Date(updateData[field]);
      else updateData[field] = null;
    }

    const profile = await prisma.patientProfile.upsert({
      where: { userId: req.user!.id },
      update: updateData,
      create: { userId: req.user!.id, ...updateData },
    });

    if (medications?.length) {
      for (const med of medications) {
        await prisma.medication.create({
          data: {
            userId: req.user!.id,
            name: med.name,
            dosage: med.dosage,
            unit: med.unit || 'mg',
            frequency: med.frequency,
            timesOfDay: med.timesOfDay || [],
            startDate: new Date(),
          },
        });
      }
    }

    res.json({ profile, message: 'Onboarding završen' });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: 'Greška pri onboardingu' });
  }
});

export default router;
