import React from 'react';
import { Html, Head, Preview, Body, Container, Text, Hr } from '@react-email/components';

/**
 * Props per email reminder interna (team Bich Immobiliare)
 */
interface ExpirationReminderInternalProps {
  contractId: number;
  ownerName: string;
  tenantName: string;
  expiryDate: string; // Formato: "15 gennaio 2028"
  type: 'contract' | 'annuity'; // Tipo scadenza
  annuityYear?: number; // Solo per type='annuity'
  address?: string; // Indirizzo immobile (opzionale)
}

/**
 * Template email INTERNA per notifiche scadenze al team.
 * Stile minimale, funzionale, colori brand Bich Immobiliare.
 * NO CTA calendario (come richiesto).
 */
const ExpirationReminderInternal = ({
  contractId,
  ownerName,
  tenantName,
  expiryDate,
  type,
  annuityYear,
  address,
}: ExpirationReminderInternalProps) => {
  // Determina il titolo in base al tipo di scadenza
  const title = type === 'contract' 
    ? 'Reminder scadenza contratto' 
    : 'Reminder scadenza annualità';

  // Messaggio principale
  const mainMessage = type === 'contract'
    ? `Il contratto di locazione scade il ${expiryDate}.`
    : `L'annualità successiva (anno ${annuityYear}) scade il ${expiryDate}.`;

  return (
    <Html>
      <Head />
      <Preview>
        {type === 'contract' 
          ? `Scadenza contratto: ${ownerName} - ${tenantName}` 
          : `Scadenza annualità ${annuityYear}: ${ownerName} - ${tenantName}`
        }
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Text style={{fontSize: '30px', marginBottom: '30px'}}>🔔</Text>
          <Text style={styles.header}>{title}</Text>

          <Hr style={styles.hr} />

          {/* Messaggio principale */}
          <Text style={styles.paragraph}>
            {mainMessage}
          </Text>

          {/* Dettagli contratto */}
          <Container style={styles.detailsBox}>
            <Text style={styles.detailRow}>
              <strong>Proprietario:</strong> {ownerName}
            </Text>
            <Text style={styles.detailRow}>
              <strong>Inquilino:</strong> {tenantName}
            </Text>
            {address && (
              <Text style={styles.detailRow}>
                <strong>Immobile:</strong> {address}
              </Text>
            )}
            <Text style={styles.detailRow}>
              <strong>Data Scadenza:</strong> {expiryDate}
            </Text>
            {type === 'annuity' && annuityYear && (
              <Text style={styles.detailRow}>
                <strong>Anno Annualità:</strong> {annuityYear}
              </Text>
            )}
          </Container>

          {/* Footer */}
          <Hr style={styles.hr} />
          <Text style={styles.footer}>
            Questa è un'email automatica generata dal sistema di gestione contratti Bich Immobiliare.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// ============= STILI - COLORI BRAND BICH IMMOBILIARE =============
const styles = {
  body: {
    backgroundColor: '#fdf5f7', // Background principale
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '30px 20px',
  },
  container: {
    backgroundColor: '#fffbfc', // Background contenitore
    padding: '30px 20px',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1e1e1e', // Colore titoli
    fontFamily: 'Merriweather, Georgia, serif',
    margin: '0 0 20px 0',
  },
  paragraph: {
    fontSize: '16px',
    color: '#5f5f5f', // Colore testo paragrafi
    lineHeight: '1.6',
    margin: '0 0 20px 0',
  },
  detailsBox: {
    backgroundColor: '#fdf5f7', // Sfondo dettagli (leggermente diverso)
    padding: '20px',
    borderRadius: '6px',
    border: '1px solid #f0d6da',
    margin: '20px 0',
  },
  detailRow: {
    fontSize: '15px',
    color: '#5f5f5f',
    lineHeight: '1.8',
    margin: '8px 0',
  },
  hr: {
    borderColor: '#f0d6da',
    borderWidth: '1px',
    margin: '20px 0',
  },
  footer: {
    fontSize: '13px',
    color: '#9f9f9f',
    lineHeight: '1.5',
    marginTop: '20px',
    textAlign: 'center' as const,
  },
};

export default ExpirationReminderInternal;