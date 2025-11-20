import React from 'react';
import { Html, Head, Preview, Body, Container, Text, Hr, Img, Section, Button, Link } from '@react-email/components';

/**
 * Props per email reminder cliente (proprietario)
 */
interface ExpirationReminderClientProps {
  ownerName: string;
  tenantName: string;
  expiryDate: string; // Formato: "15 gennaio 2028"
  type: 'contract' | 'annuity';
  annuityYear?: number; // Solo per type='annuity'
  address?: string; // Indirizzo immobile (opzionale)
}

/**
 * Template email PROFESSIONALE per notifiche scadenze ai clienti.
 * Design branded Bich Immobiliare con logo, colori aziendali, tono formale.
 * 
 * IMPORTANTE: Il logo deve essere hostato su un server pubblico.
 * Aggiorna LOGO_URL con l'URL reale del logo.
 */
const ExpirationReminderClient = ({
  ownerName,
  tenantName,
  expiryDate,
  type,
  annuityYear,
  address,
}: ExpirationReminderClientProps) => {
  // ⭐ AGGIORNARE CON URL REALE DEL LOGO HOSTATO
  const LOGO_URL = 'https://bichimmobiliare.it/wp-content/uploads/2025/11/logo-mail-trasparente.png';

  // Saluto personalizzato
  const greeting = `Gentile ${ownerName},`;

  // Messaggio principale basato sul tipo di scadenza
  const mainMessage = type === 'contract'
    ? `Le scriviamo per informarla che il contratto di locazione dell'immobile${address ? ` sito in ${address}` : ''} scadrà in data ${expiryDate}.`
    : `Le scriviamo per ricordarle che l'annualità successiva (anno ${annuityYear}) per il contratto di locazione${address ? ` dell'immobile sito in ${address}` : ''} scadrà in data ${expiryDate}.`;

  // Call-to-action
  const ctaMessage = type === 'contract'
    ? 'La invitiamo a contattarci per discutere le modalità di rinnovo o eventuali modifiche contrattuali.'
    : 'La invitiamo a contattarci per procedere con il pagamento e il rinnovo dell\'annualità.';

  return (
    <Html>
      <Head />
      <Preview>
        {type === 'contract'
          ? `🔔 Scadenza contratto di locazione - ${expiryDate}`
          : `🔔 Scadenza annualità ${annuityYear} - ${expiryDate}`
        }
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* ============= HEADER CON LOGO ============= */}
          <Section style={styles.header}>
            <Img
              src={LOGO_URL}
              alt="Bich Immobiliare"
              style={styles.logo}
            />
          </Section>

          <Hr style={styles.hr} />

          {/* ============= CONTENUTO PRINCIPALE ============= */}
          <Container style={styles.content} className="content">
            {/* Saluto */}
            <Text style={styles.greeting}>{greeting}</Text>

            {/* Messaggio principale */}
            <Text style={styles.paragraph}>
              {mainMessage}
            </Text>

            {/* Dettagli contratto */}
            <Container style={styles.detailsBox}>
              <Text style={styles.detailsTitle}>Dettagli Contratto 📜</Text>
              
              <Text style={styles.detailRow}>
                <strong>Inquilino:</strong> {tenantName}
              </Text>
              
              {address && (
                <Text style={styles.detailRow}>
                  <strong>Immobile:</strong> {address}
                </Text>
              )}
              
              <Text style={styles.detailRow}>
                <strong>Data di Scadenza:</strong> {expiryDate}
              </Text>
              
              {type === 'annuity' && annuityYear && (
                <Text style={styles.detailRow}>
                  <strong>Anno Annualità:</strong> {annuityYear}
                </Text>
              )}
            </Container>

            {/* Call to Action */}
            <Text style={styles.paragraph}>
              {ctaMessage}
            </Text>

            {/* Chiusura formale */}
            <Text style={styles.paragraph}>
              Restiamo a sua completa disposizione per qualsiasi chiarimento.
            </Text>

            {/* Pulsante di Chiamata */}
            <Section style={styles.callToActionContainer}>
              <Button
                href="tel:012545148"
                style={styles.callToActionButton}
              >
                0125 45148
              </Button>
            </Section>

            <Text style={styles.signature}>
              Cordiali saluti,<br />
              <strong>Il Team Bich Immobiliare</strong>
            </Text>
          </Container>

          {/* ============= FOOTER ============= */}
          <Hr style={styles.hr} />
          <Container style={styles.footer}>
            <Text style={styles.footerText}>
              <strong>BICH IMMOBILIARE</strong>
            </Text>
            <Text style={styles.footerText}>
              Via Jervis 64, 10015 Ivrea (TO)<br />
              Tel: 0125.45148 | Email: info@bichimmobiliare.it <br />
              P.IVA: 07636590015 | REA: TO907845 <br />
              <Link href="https://www.bichimmobiliare.it" style={{color: '#b41c3c'}}>www.bichimmobiliare.it</Link>
            </Text>
            <Text style={styles.footerDisclaimer}>
              Questa è un'email automatica. Si prega di non rispondere direttamente a questo messaggio. Ha ricevuto questa email perché risulta nella nostra lista di contratti in gestione. Se desidera modificare le sue preferenze di comunicazione, ci contatti direttamente.
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  );
};

// ============= STILI - BRAND BICH IMMOBILIARE =============
const styles = {
  body: {
    backgroundColor: '#fdf5f7', // Background principale
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '10px 10px',
  },
  container: {
    backgroundColor: '#fffbfc', // Background contenitore
    maxWidth: '600px',
    margin: '0 auto',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  header: {
    backgroundColor: '#fffbfc', // Background header
    padding: '30px 20px',
    textAlign: 'center' as const,
  },
  logo: {
    maxWidth: '200px',
    height: 'auto',
    margin: '0 auto',
  },
  content: {
    padding: '30px 20px',
  },
  greeting: {
    fontSize: '22px',
    color: '#1e1e1e',
    fontFamily: 'Merriweather, Georgia, serif',
    fontWeight: '800',
    marginBottom: '20px',
  },
  paragraph: {
    fontSize: '16px',
    color: '#5f5f5f', // Colore testo paragrafi
    lineHeight: '1.7',
    margin: '0 0 20px 0',
  },
  detailsBox: {
    backgroundColor: '#fdf5f7', // Sfondo box dettagli
    padding: '15px 20px',
    borderRadius: '8px',
    border: '1px solid #f0d6da',
    margin: '25px 0',
  },
  detailsTitle: {
    fontSize: '18px',
    color: '#1e1e1e',
    fontFamily: 'Merriweather, Georgia, serif',
    fontWeight: '800',
    marginBottom: '16px',
  },
  detailRow: {
    fontSize: '15px',
    color: '#5f5f5f',
    lineHeight: '1.8',
    margin: '10px 0',
  },
  signature: {
    fontSize: '16px',
    color: '#5f5f5f',
    lineHeight: '1.7',
    marginTop: '50px',
  },
  callToActionContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  callToActionButton: {
    backgroundColor: '#b41c3c', // Colore primario brand
    color: '#fffbfc',
    padding: '14px 28px',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
  },
  hr: {
    borderColor: '#f0d6da',
    borderWidth: '1px',
    margin: '0',
  },
  footer: {
    backgroundColor: '#fffbfc', // Background footer
    padding: '30px 40px',
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '14px',
    color: '#5f5f5f',
    lineHeight: '1.6',
    margin: '8px 0',
  },
  footerDisclaimer: {
    fontSize: '12px',
    color: '#9f9f9f',
    lineHeight: '1.5',
    marginTop: '20px',
    fontStyle: 'italic' as const,
  },
};

export default ExpirationReminderClient;