import { Resend } from 'resend';
import { render } from '@react-email/render';
import ResetPasswordEmail from '../emails/ResetPasswordEmail';
import AppError from '../utils/AppError';

// Inizializza client Resend con API key da env
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Invia email per il reset della password.
 * Genera il link con token e lo invia all'utente tramite Resend API.
 * 
 * @param to - Email destinatario
 * @param token - Token univoco per il reset
 * @throws AppError 500 se l'invio fallisce
 */
export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  console.log('[EMAIL_SERVICE] Preparazione invio email reset password a:', to);

  // Costruisce l'URL completo per il reset (frontend)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  console.log('[EMAIL_SERVICE] Reset URL generato:', resetUrl);

  try {
    // Renderizza il componente React Email in HTML
    const html = await render(ResetPasswordEmail({ resetUrl }));
    console.log('[EMAIL_SERVICE] Template email renderizzato');

    // Invia email tramite Resend API
    const { data, error } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Reset della password',
      html, // Usa HTML renderizzato, non JSX diretto
    });

    if (error) {
      console.error('[EMAIL_SERVICE] ❌ Errore Resend API:', error);
      throw new AppError('Impossibile inviare email di reset', 500);
    }

    console.log('[EMAIL_SERVICE] ✅ Email reset inviata con successo. ID:', data?.id);
  } catch (error) {
    // Se è già un AppError, rilancia
    if (error instanceof AppError) {
      throw error;
    }

    // Per errori generici
    console.error('[EMAIL_SERVICE] ❌ Errore imprevisto durante invio email:', error);
    throw new AppError('Errore nell\'invio dell\'email di recupero password', 500);
  }
};
