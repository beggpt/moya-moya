import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`);
    return;
  }

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'noreply@moyamoya.app',
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendEmail(to, 'Potvrdi email adresu - MoyaMoya Companion', `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #0D9488; font-size: 24px;">MoyaMoya Companion</h1>
      <p style="font-size: 16px; color: #292524; line-height: 1.6;">
        Hvala na registraciji! Klikni na link ispod za potvrdu email adrese:
      </p>
      <a href="${url}" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
        Potvrdi email
      </a>
      <p style="font-size: 14px; color: #78716C;">
        Ako nisi kreirao/la račun, ignoriraj ovaj email.
      </p>
    </div>
  `);
}

export async function sendSOSAlert(to: string, patientName: string, location?: string) {
  await sendEmail(to, `⚠️ SOS ALERT - ${patientName} - MoyaMoya Companion`, `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="background: #DC2626; color: white; padding: 20px; border-radius: 12px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">⚠️ SOS ALERT</h1>
      </div>
      <div style="padding: 24px 0;">
        <p style="font-size: 18px; color: #292524; line-height: 1.6;">
          <strong>${patientName}</strong> je aktivirao/la SOS upozorenje u MoyaMoya Companion aplikaciji.
        </p>
        ${location ? `<p style="font-size: 16px; color: #292524;">📍 Lokacija: ${location}</p>` : ''}
        <p style="font-size: 16px; color: #292524; line-height: 1.6;">
          Molimo kontaktirajte osobu što prije ili pozovite hitnu pomoć.
        </p>
        <div style="background: #FEF2F2; border: 2px solid #DC2626; border-radius: 8px; padding: 16px; margin-top: 20px;">
          <p style="font-size: 14px; color: #DC2626; margin: 0;">
            <strong>Dijagnoza:</strong> Moyamoya bolest<br>
            Pozovite 194 (Hitna pomoć) ako ne možete stupiti u kontakt.
          </p>
        </div>
      </div>
    </div>
  `);
}

export async function sendCaregiverInvite(to: string, patientName: string, token: string) {
  const url = `${process.env.FRONTEND_URL}/caregiver/accept?token=${token}`;
  await sendEmail(to, `${patientName} vas poziva kao skrbnika - MoyaMoya Companion`, `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #0D9488; font-size: 24px;">MoyaMoya Companion</h1>
      <p style="font-size: 16px; color: #292524; line-height: 1.6;">
        <strong>${patientName}</strong> vas poziva da budete njihov skrbnik u MoyaMoya Companion aplikaciji.
      </p>
      <p style="font-size: 16px; color: #292524; line-height: 1.6;">
        Kao skrbnik moći ćete pratiti njihovo zdravstveno stanje i primati obavijesti.
      </p>
      <a href="${url}" style="display: inline-block; background: #0D9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
        Prihvati pozivnicu
      </a>
    </div>
  `);
}
