import { Resend } from 'resend';
import ResetPasswordEmail from '../emails/ResetPasswordEmail';

const resend = new Resend(process.env.RESEND_API_KEY as string); 

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Reset della password',
      react: ResetPasswordEmail({ resetUrl }),
    });

    console.log(`[EMAIL_SERVICE] Email reset inviata a: ${to}`);
  } catch (error) {
    console.error('[EMAIL_SERVICE] Errore invio email reset:', error);
    throw new Error('Impossibile inviare email di reset');
  }
};
