import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import symptomRoutes from './routes/symptoms';
import medicationRoutes from './routes/medications';
import bpRoutes from './routes/bloodPressure';
import cognitiveRoutes from './routes/cognitive';
import appointmentRoutes from './routes/appointments';
import exerciseRoutes from './routes/exercise';
import emergencyRoutes from './routes/emergency';
import caregiverRoutes from './routes/caregiver';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import postRoutes from './routes/posts';
import forumRoutes from './routes/forum';
import friendRoutes from './routes/friends';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/bp', bpRoutes);
app.use('/api/cognitive', cognitiveRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/caregiver', caregiverRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/friends', friendRoutes);

// Educational content (public)
app.get('/api/content', async (_req, res) => {
  const { prisma } = await import('./utils/prisma');
  const { category, locale = 'hr' } = _req.query;
  const where: any = { published: true, locale: locale as string };
  if (category) where.category = category;
  const content = await prisma.educationalContent.findMany({
    where,
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });
  res.json(content);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', name: 'MoyaMoya Companion API' });
});

app.listen(PORT, () => {
  console.log(`🏥 MoyaMoya Companion API running on port ${PORT}`);
});

export default app;
