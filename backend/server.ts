import dotenv from 'dotenv';
import path from 'path';

// ============= CARICAMENTO VARIABILI D'AMBIENTE =============
// FIX: Carica .env solo se NON siamo in produzione.
// In produzione su Netsons/cPanel usiamo le variabili d'ambiente dell'interfaccia.
if (process.env.NODE_ENV !== 'production') {
  // In dev (locale), cerca il file .env.dev nella root (salendo di un livello da /dist se serve)
  const envPath = path.resolve(__dirname, process.env.NODE_ENV === 'test' ? '..' : '', '.env.dev');
  dotenv.config({ path: envPath });
  console.log('[SERVER] 🔧 Loaded local env file from:', envPath);
} else {
  console.log('[SERVER] 🚀 Production mode: Using system environment variables (cPanel).');
}
// ==================================================================

import express, { Application } from 'express';
import { errorHandler } from './middleware/errorHandler.middleware';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron'; // Import node-cron
import * as notificationService from './services/notification.service'; // Import notification service

// Import routes
const authRoutes = require('./routes/auth.routes');
import userRoutes from './routes/user.routes';
import ownerRoutes from './routes/owner.routes';
import contractRoutes from './routes/contract.routes';
import dashboardRoutes from "./routes/dashboard.routes";

// ============= VALIDAZIONE VARIABILI D'AMBIENTE =============
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'RESEND_API_KEY',
  'FRONTEND_URL',
  'FROM_EMAIL',
  'FROM_NAME',
  // CRON_NOTIFICATION_TIME è opzionale, ha un default ('0 8 * * *')
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

// Se mancano variabili d'ambiente obbligatorie, esci con errore
if (missingEnvVars.length > 0) {
  console.error('[SERVER] ❌ ERRORE: Variabili d\'ambiente mancanti:', missingEnvVars.join(', '));
  process.exit(1);
}

// Log variabili d'ambiente caricate (senza valori sensibili)
console.log('[SERVER] ✅ Variabili d\'ambiente caricate e validate');
console.log('[SERVER] Ambiente:', process.env.NODE_ENV || 'development');

// ============= INIZIALIZZAZIONE APP =============
const app: Application = express();

// ============= MIDDLEWARE GLOBALI =============

// Security headers
app.use(helmet());
console.log('[SERVER] ✅ Helmet configurato');

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
console.log('[SERVER] ✅ CORS configurato per:', process.env.FRONTEND_URL);

// ============= ROTTA DI TEST ASSOLUTO =============
app.get('/test-server-live', (req, res) => {
  console.log('[SERVER] 🔥 Rotta di Test Live Trovata!'); // Questo DEVE apparire nel log
  res.status(200).json({ 
    success: true, 
    message: 'Risposta diretta dal Server.js (Rotta di test OK)',
    timestamp: new Date().toISOString()
  });
});
// =================================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('[SERVER] ✅ Body parser configurato');

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============= ROUTES =============

// Rotta base di test
app.get('/', (req, res) => {
  res.send('Server pronto 🥳');
});

// Auth routes
app.use('/api/auth', authRoutes);
console.log('[SERVER] ✅ Route /api/auth montate');

// User routes
app.use('/api/user', userRoutes);
console.log('[SERVER] ✅ Route /api/user montate');

// Owner routes
app.use('/api/owner', ownerRoutes);
console.log('[SERVER] ✅ Route /api/owner montate');

// Contract routes
app.use('/api/contract', contractRoutes);
console.log('[SERVER] ✅ Route /api/contract montate');

// Dashboard routes
app.use("/api/dashboard", dashboardRoutes);
console.log("[SERVER] ✅ Route /api/dashboard montate");

// ============= 404 HANDLER =============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trovato',
  });
});

// ============= ERROR HANDLER =============
app.use(errorHandler);

// ============= AVVIO SERVER =============
if (process.env.NODE_ENV !== 'test') {
  // IMPORTANTE: Su cPanel la porta non è un numero, è una "named pipe".
  // Dobbiamo usare quella stringa esattamente come arriva.
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`[SERVER] 🚀 Server avviato in ambiente: ${process.env.NODE_ENV}`);
    // Non stampare URL con localhost in produzione perché usiamo una pipe
  });

  // ============= GRACEFUL SHUTDOWN =============
  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM ricevuto, chiusura graceful...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[SERVER] SIGINT ricevuto, chiusura graceful...');
    process.exit(0);
  });
}

// ============= CRON JOB SCHEDULER =============
// Inizializza il cron job sia in sviluppo che in produzione
if (process.env.NODE_ENV !== 'test') {
  // Legge l'orario dal .env (es: "0 8 * * *" per le 08:00 di mattina)
  const cronTime = process.env.CRON_NOTIFICATION_TIME || '0 8 * * *';
  
  console.log(`[CRON] 🕒 Scheduler inizializzato con orario: "${cronTime}"`);
  
  cron.schedule(cronTime, async () => {
    console.log(`[CRON] 🔔 Esecuzione job notifiche automatiche: ${new Date().toISOString()}`);
    
    try {
      // Esegue il servizio di notifica
      const stats = await notificationService.sendExpiringContractsNotifications();
      
      console.log('[CRON] ✅ Job completato con successo.');
      console.log('[CRON] 📊 Statistiche:', stats);
    } catch (error) {
      console.error('[CRON] ❌ Errore imprevisto durante l\'esecuzione del job:', error);
    }
  });
}

export default app;