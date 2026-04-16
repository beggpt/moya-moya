import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Generate PDF report
router.post('/generate', async (req: AuthRequest, res) => {
  try {
    const { from, to, sections = ['symptoms', 'medications', 'bp', 'cognitive'] } = req.body;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true },
    });

    const [symptoms, medications, bpReadings, cogTests] = await Promise.all([
      sections.includes('symptoms') ? prisma.symptomLog.findMany({
        where: { userId: req.user!.id, timestamp: { gte: fromDate, lte: toDate } },
        orderBy: { timestamp: 'desc' },
      }) : [],
      sections.includes('medications') ? prisma.medication.findMany({
        where: { userId: req.user!.id, active: true },
        include: {
          reminders: { where: { scheduledAt: { gte: fromDate, lte: toDate } } },
        },
      }) : [],
      sections.includes('bp') ? prisma.bPReading.findMany({
        where: { userId: req.user!.id, timestamp: { gte: fromDate, lte: toDate } },
        orderBy: { timestamp: 'desc' },
      }) : [],
      sections.includes('cognitive') ? prisma.cognitiveTest.findMany({
        where: { userId: req.user!.id, timestamp: { gte: fromDate, lte: toDate } },
        orderBy: { timestamp: 'desc' },
      }) : [],
    ]);

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=moyamoya-report-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#0D9488').text('MoyaMoya Companion', { align: 'center' });
    doc.fontSize(12).fillColor('#78716C').text('Izvještaj za liječnika', { align: 'center' });
    doc.moveDown();

    // Patient info
    doc.fontSize(14).fillColor('#292524').text('Podaci o pacijentu');
    doc.fontSize(10).fillColor('#57534E');
    doc.text(`Ime: ${user?.name || '-'}`);
    if (user?.profile) {
      const p = user.profile;
      doc.text(`Datum rođenja: ${p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('hr') : '-'}`);
      doc.text(`Dijagnoza: Moyamoya ${p.moyamoyaType === 'SYNDROME' ? 'sindrom' : 'bolest'}`);
      doc.text(`Suzuki stadij: ${p.suzukiStage || '-'}`);
      doc.text(`Zahvaćena strana: ${p.affectedSide || '-'}`);
      if (p.hadSurgery) doc.text(`Operacija: ${p.surgeryType || 'Da'} (${p.surgeryDate ? new Date(p.surgeryDate).toLocaleDateString('hr') : '-'})`);
      doc.text(`Krvna grupa: ${p.bloodType || '-'}`);
      doc.text(`Alergije: ${p.allergies || 'Nema'}`);
    }
    doc.moveDown();

    doc.fontSize(10).fillColor('#78716C').text(`Period izvještaja: ${fromDate.toLocaleDateString('hr')} - ${toDate.toLocaleDateString('hr')}`);
    doc.moveDown();

    // Symptoms
    if (sections.includes('symptoms') && symptoms.length > 0) {
      doc.fontSize(14).fillColor('#292524').text('Simptomi');
      doc.fontSize(10).fillColor('#57534E');
      doc.text(`Ukupno zapisa: ${symptoms.length}`);

      const typeCounts: Record<string, number> = {};
      symptoms.forEach((s: any) => { typeCounts[s.type] = (typeCounts[s.type] || 0) + 1; });

      const typeLabels: Record<string, string> = {
        TIA: 'TIA', HEADACHE: 'Glavobolja', WEAKNESS: 'Slabost',
        NUMBNESS: 'Utrnulost', SPEECH_DIFFICULTY: 'Poteškoće s govorom',
        VISION_CHANGE: 'Promjene vida', SEIZURE: 'Napadaj',
        DIZZINESS: 'Vrtoglavica', CONFUSION: 'Konfuzija',
        BALANCE_LOSS: 'Gubitak ravnoteže', OTHER: 'Ostalo',
      };

      Object.entries(typeCounts).forEach(([type, count]) => {
        doc.text(`  ${typeLabels[type] || type}: ${count}x`);
      });

      const emergencies = symptoms.filter((s: any) => s.wasEmergency);
      if (emergencies.length > 0) {
        doc.fillColor('#DC2626').text(`  Hitni slučajevi: ${emergencies.length}`);
        doc.fillColor('#57534E');
      }
      doc.moveDown();
    }

    // Medications
    if (sections.includes('medications') && medications.length > 0) {
      doc.fontSize(14).fillColor('#292524').text('Lijekovi');
      doc.fontSize(10).fillColor('#57534E');

      medications.forEach((med: any) => {
        const total = med.reminders.length;
        const taken = med.reminders.filter((r: any) => r.takenAt).length;
        const rate = total > 0 ? Math.round((taken / total) * 100) : 100;
        doc.text(`  ${med.name} ${med.dosage}${med.unit} - ${med.frequency} (adherencija: ${rate}%)`);
      });
      doc.moveDown();
    }

    // Blood Pressure
    if (sections.includes('bp') && bpReadings.length > 0) {
      doc.fontSize(14).fillColor('#292524').text('Krvni tlak');
      doc.fontSize(10).fillColor('#57534E');
      doc.text(`Ukupno mjerenja: ${bpReadings.length}`);

      const avgSys = Math.round(bpReadings.reduce((s: number, r: any) => s + r.systolic, 0) / bpReadings.length);
      const avgDia = Math.round(bpReadings.reduce((s: number, r: any) => s + r.diastolic, 0) / bpReadings.length);
      doc.text(`  Prosjek: ${avgSys}/${avgDia} mmHg`);

      const maxSys = Math.max(...bpReadings.map((r: any) => r.systolic));
      const minSys = Math.min(...bpReadings.map((r: any) => r.systolic));
      doc.text(`  Raspon sistoličkog: ${minSys}-${maxSys} mmHg`);
      doc.moveDown();
    }

    // Cognitive
    if (sections.includes('cognitive') && cogTests.length > 0) {
      doc.fontSize(14).fillColor('#292524').text('Kognitivni testovi');
      doc.fontSize(10).fillColor('#57534E');
      doc.text(`Ukupno testova: ${cogTests.length}`);

      const testLabels: Record<string, string> = {
        REACTION_TIME: 'Reakcijsko vrijeme', MEMORY_RECALL: 'Pamćenje',
        PATTERN_MATCH: 'Prepoznavanje uzoraka', WORD_FLUENCY: 'Fluentnost riječi',
        DIGIT_SPAN: 'Raspon brojeva', STROOP: 'Stroop test',
      };

      const byType: Record<string, any[]> = {};
      cogTests.forEach((t: any) => {
        if (!byType[t.testType]) byType[t.testType] = [];
        byType[t.testType].push(t);
      });

      Object.entries(byType).forEach(([type, tests]) => {
        const latest = tests[0];
        const oldest = tests[tests.length - 1];
        const change = tests.length > 1 ? ((latest.score - oldest.score) / oldest.score * 100).toFixed(1) : '0';
        doc.text(`  ${testLabels[type] || type}: zadnji rezultat ${latest.score}${latest.maxScore ? `/${latest.maxScore}` : ''} (promjena: ${change}%)`);
      });
      doc.moveDown();
    }

    // Footer
    doc.fontSize(8).fillColor('#A8A29E');
    doc.text(`Generirano: ${new Date().toLocaleString('hr')} | MoyaMoya Companion`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Greška pri generiranju izvještaja' });
  }
});

export default router;
