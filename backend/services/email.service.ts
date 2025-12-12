
import { Resend } from 'resend';
import { render } from '@react-email/render';
// @ts-ignore
import ResetPasswordEmail from '../emails/ResetPasswordEmail';
// @ts-ignore
import ExpirationReminderInternal from '../emails/ExpirationReminderInternal';
// @ts-ignore
import ExpirationReminderClient from '../emails/ExpirationReminderClient';
import AppError from '../utils/AppError';
import { ContractWithRelations } from '../types/api';
import dayjs from 'dayjs';
import 'dayjs/locale/it'; // Locale italiano per formattazione date
import utc from 'dayjs/plugin/utc';
import { logInfo, logError } from './logger.service';

// Configura Day.js
dayjs.extend(utc);
dayjs.locale('it'); // Imposta locale italiano globalmente

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
  logInfo('[EMAIL_SERVICE] Preparazione invio email reset password a: ' + to);

  // Costruisce l'URL completo per il reset (frontend)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  logInfo('[EMAIL_SERVICE] Reset URL generato: ' + resetUrl);

  try {
    // Renderizza il componente React Email in HTML
    const html = await render(ResetPasswordEmail({ resetUrl }));
    logInfo('[EMAIL_SERVICE] Template email renderizzato');

    // Invia email tramite Resend API
    const { data, error } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject: 'Reset della password',
      html, // Usa HTML renderizzato, non JSX diretto
    });

    if (error) {
      logError('[EMAIL_SERVICE] ❌ Errore Resend API:', error);
      throw new AppError('Impossibile inviare email di reset', 500);
    }

    logInfo('[EMAIL_SERVICE] ✅ Email reset inviata con successo. ID: ' + data?.id);
  } catch (error) {
    // Se è già un AppError, rilancia
    if (error instanceof AppError) {
      throw error;
    }

    // Per errori generici
    logError('[EMAIL_SERVICE] ❌ Errore imprevisto durante invio email:', error);
    throw new AppError('Errore nell\'invio dell\'email di recupero password', 500);
  }
};

/**
 * Formatta una data in formato italiano leggibile.
 * Esempio: "15 gennaio 2028"
 * 
 * @param date - Data in formato YYYY-MM-DD o Date object
 * @returns Data formattata in italiano (es: "15 gennaio 2028")
 */
const formatDateItalian = (date: string | Date): string => {
  return dayjs(date).format('D MMMM YYYY');
};

/**
 * Invia email di reminder scadenza al team interno.
 * Template semplice e funzionale con dati essenziali del contratto.
 * 
 * Gestione errori: "best effort" - logga errori ma NON blocca il flusso.
 * 
 * @param contract - Contratto completo con owner e tenant
 * @param type - Tipo di scadenza ('contract' | 'annuity')
 * @param year - Anno annualità (opzionale, solo per type='annuity')
 * @returns true se invio riuscito, false altrimenti
 */
export const sendExpirationReminderInternal = async (
  contract: ContractWithRelations,
  type: 'contract' | 'annuity',
  year?: number
): Promise<boolean> => {
  logInfo('[EMAIL_SERVICE] 📧 Preparazione email reminder interna per contratto: ' + contract.id);

  try {
    // Estrai dati necessari dal contratto
    const ownerName = `${contract.owner.name} ${contract.owner.surname}`;
    const tenantName = `${contract.tenant.name} ${contract.tenant.surname}`;
    
    // Determina data di scadenza in base al tipo
    const expiryDateRaw = type === 'contract' ? contract.end_date : 
      contract.annuities?.find(a => a.year === year)?.due_date;
    
    if (!expiryDateRaw) {
      console.error('[EMAIL_SERVICE] ❌ Data di scadenza non trovata per contratto:', contract.id);
      return false;
    }

    const expiryDate = formatDateItalian(expiryDateRaw);
    console.log('[EMAIL_SERVICE] Data scadenza formattata:', expiryDate);

    // Renderizza template React Email in HTML
    const html = await render(
      ExpirationReminderInternal({
        contractId: contract.id,
        ownerName,
        tenantName,
        expiryDate,
        type,
        annuityYear: year,
        address: contract.address, // Opzionale
      })
    );

    logInfo('[EMAIL_SERVICE] ✅ Template interno renderizzato');

    // Determina subject dinamico
    const subject = type === 'contract' 
      ? `🔔 Scadenza contratto: ${ownerName} - ${tenantName}`
      : `🔔 Scadenza annualità ${year}: ${ownerName} - ${tenantName}`;

    // Invia email tramite Resend API
    const { data, error } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: process.env.INTERNAL_NOTIFICATION_EMAIL as string,
      subject,
      html,
    });

    if (error) {
      console.error('[EMAIL_SERVICE] ❌ Errore Resend API (email interna):', error);
      return false; // Best effort: non bloccare il flusso
    }

    logInfo('[EMAIL_SERVICE] ✅ Email interna inviata con successo. ID: ' + data?.id);
    return true;

  } catch (error) {
    // Log errore ma NON interrompere il flusso (best effort)
    logError('[EMAIL_SERVICE] ❌ Errore invio email interna:', error);
    return false;
  }
};

/**
 * Invia email di reminder scadenza al cliente (proprietario).
 * Template professionale e branded con tono formale.
 * 
 * Gestione errori: "best effort" - logga errori ma NON blocca il flusso.
 * 
 * @param contract - Contratto completo con owner e tenant
 * @param type - Tipo di scadenza ('contract' | 'annuity')
 * @param year - Anno annualità (opzionale, solo per type='annuity')
 * @returns true se invio riuscito, false altrimenti
 */
export const sendExpirationReminderClient = async (
  contract: ContractWithRelations,
  type: 'contract' | 'annuity',
  year?: number
): Promise<boolean> => {
  logInfo('[EMAIL_SERVICE] 📧 Preparazione email reminder cliente per contratto: ' + contract.id);

  try {
    // Estrai dati necessari dal contratto
    const ownerName = contract.owner.name; // Solo nome per saluto (es: "Gentile Paolo")
    const tenantName = `${contract.tenant.name} ${contract.tenant.surname}`; // Nome completo
    
    // Verifica che owner abbia email
    if (!contract.owner.email) {
      console.error('[EMAIL_SERVICE] ❌ Proprietario senza email, skip invio:', contract.owner.id);
      return false;
    }

    // Determina data di scadenza in base al tipo
    const expiryDateRaw = type === 'contract' ? contract.end_date : 
      contract.annuities?.find(a => a.year === year)?.due_date;
    
    if (!expiryDateRaw) {
      console.error('[EMAIL_SERVICE] ❌ Data di scadenza non trovata per contratto:', contract.id);
      return false;
    }

    const expiryDate = formatDateItalian(expiryDateRaw);
    console.log('[EMAIL_SERVICE] Data scadenza formattata:', expiryDate);

    // Renderizza template React Email in HTML
    const html = await render(
      ExpirationReminderClient({
        ownerName, // Solo nome per saluto personalizzato
        tenantName, // Nome completo inquilino
        expiryDate,
        type,
        annuityYear: year,
        address: contract.address, // Opzionale
      })
    );

    logInfo('[EMAIL_SERVICE] ✅ Template cliente renderizzato');

    // Determina subject dinamico
    const subject = type === 'contract' 
      ? `🔔 Scadenza contratto di locazione - ${expiryDate}`
      : `🔔 Scadenza annualità ${year} - ${expiryDate}`;

    // Invia email tramite Resend API
    const { data, error } = await resend.emails.send({
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: contract.owner.email,
      subject,
      html,
    });

    if (error) {
      console.error('[EMAIL_SERVICE] ❌ Errore Resend API (email cliente):', error);
      return false; // Best effort: non bloccare il flusso
    }

    logInfo('[EMAIL_SERVICE] ✅ Email cliente inviata con successo a: ' + contract.owner.email + ' ID: ' + data?.id);
    return true;

  } catch (error) {
    // Log errore ma NON interrompere il flusso (best effort)
    logError('[EMAIL_SERVICE] ❌ Errore invio email cliente:', error);
    return false;
  }
};