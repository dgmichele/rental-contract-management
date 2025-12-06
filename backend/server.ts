import dotenv from 'dotenv';
import path from 'path';

// ============= CARICAMENTO VARIABILI D'AMBIENTE =============
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, process.env.NODE_ENV === 'test' ? '..' : '', '.env.dev');
  dotenv.config({ path: envPath });
  console.log('[SERVER] 🔧 Loaded local env file from:', envPath);
} else {
  console.log('[SERVER] 🚀 Production mode: Using system environment variables (cPanel).');
}

import express, { Application, Request, Response, NextFunction } from 'express';
import { errorHandler } from './middleware/errorHandler.middleware';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import * as notificationService from './services/notification.service';

// ============= LOGGING MIDDLEWARE GLOBALE =============
// Questo DEVE essere il primo middleware per tracciare TUTTE le richieste
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log('[REQUEST] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[REQUEST] Body:', JSON.stringify(req.body, null, 2));
  next();
};

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
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('[SERVER] ❌ ERRORE: Variabili d\'ambiente mancanti:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('[SERVER] ✅ Variabili d\'ambiente caricate e validate');
console.log('[SERVER] Ambiente:', process.env.NODE_ENV || 'development');

// ============= INIZIALIZZAZIONE APP =============
const app: Application = express();

// ============= MIDDLEWARE GLOBALI (ORDINE CRITICO) =============

// 1. LOGGING (prima di tutto per tracciare ogni richiesta)
app.use(requestLogger);

// 2. Security headers
app.use(helmet());
console.log('[SERVER] ✅ Helmet configurato');

// 3. CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
console.log('[SERVER] ✅ CORS configurato per:', process.env.FRONTEND_URL);

// 4. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('[SERVER] ✅ Body parser configurato');

// ============= HEALTH CHECK =============
app.get('/health', (req, res) => {
  console.log('[HEALTH] Endpoint raggiunto');
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============= ROTTA DI TEST ASSOLUTO =============
app.get('/test-server-live', (req, res) => {
  console.log('[SERVER] 🔥 Rotta di Test Live raggiunta');
  res.status(200).json({ 
    success: true, 
    message: 'Risposta diretta dal Server.js (Rotta di test OK)',
    timestamp: new Date().toISOString()
  });
});

// ============= ROUTES =============

// Rotta base di test
app.get('/', (req, res) => {
  console.log('[SERVER] Homepage raggiunta');
  res.send('Server pronto 🥳');
});

// ============= IMPORT ROUTES CON TRY/CATCH =============
console.log('[SERVER] 📦 Tentativo di importazione routes...');

try {
  // Import con path logging
  console.log('[SERVER] Importing auth routes from:', path.join(__dirname, 'routes', 'auth.routes'));
  const authRoutes = require('./routes/auth.routes').default;
  app.use('/api/auth', authRoutes);
  console.log('[SERVER] ✅ Route /api/auth montate con successo');
} catch (error) {
  console.error('[SERVER] ❌ ERRORE nel montare auth routes:', error);
}

try {
  console.log('[SERVER] Importing user routes from:', path.join(__dirname, 'routes', 'user.routes'));
  const userRoutes = require('./routes/user.routes').default;
  app.use('/api/user', userRoutes);
  console.log('[SERVER] ✅ Route /api/user montate con successo');
} catch (error) {
  console.error('[SERVER] ❌ ERRORE nel montare user routes:', error);
}

try {
  console.log('[SERVER] Importing owner routes from:', path.join(__dirname, 'routes', 'owner.routes'));
  const ownerRoutes = require('./routes/owner.routes').default;
  app.use('/api/owner', ownerRoutes);
  console.log('[SERVER] ✅ Route /api/owner montate con successo');
} catch (error) {
  console.error('[SERVER] ❌ ERRORE nel montare owner routes:', error);
}

try {
  console.log('[SERVER] Importing contract routes from:', path.join(__dirname, 'routes', 'contract.routes'));
  const contractRoutes = require('./routes/contract.routes').default;
  app.use('/api/contract', contractRoutes);
  console.log('[SERVER] ✅ Route /api/contract montate con successo');
} catch (error) {
  console.error('[SERVER] ❌ ERRORE nel montare contract routes:', error);
}

try {
  console.log('[SERVER] Importing dashboard routes from:', path.join(__dirname, 'routes', 'dashboard.routes'));
  const dashboardRoutes = require('./routes/dashboard.routes').default;
  app.use('/api/dashboard', dashboardRoutes);
  console.log('[SERVER] ✅ Route /api/dashboard montate con successo');
} catch (error) {
  console.error('[SERVER] ❌ ERRORE nel montare dashboard routes:', error);
}

// ============= DEBUG: STAMPA TUTTE LE ROUTES REGISTRATE =============
console.log('[SERVER] 📋 Routes registrate:');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Route dirette
    console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router montati
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
        console.log(`  ${methods} ${path}`);
      }
    });
  }
});

// ============= 404 HANDLER =============
app.use((req, res) => {
  console.log('[404] Endpoint non trovato:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Endpoint non trovato',
    requestedPath: req.path,
    method: req.method
  });
});

// ============= ERROR HANDLER =============
app.use(errorHandler);

// ============= AVVIO SERVER =============
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`[SERVER] 🚀 Server avviato in ambiente: ${process.env.NODE_ENV}`);
    console.log(`[SERVER] 📍 Listening on port/pipe: ${PORT}`);
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
if (process.env.NODE_ENV !== 'test') {
  const cronTime = process.env.CRON_NOTIFICATION_TIME || '0 8 * * *';
  
  console.log(`[CRON] 🕐 Scheduler inizializzato con orario: "${cronTime}"`);
  
  cron.schedule(cronTime, async () => {
    console.log(`[CRON] 🔔 Esecuzione job notifiche automatiche: ${new Date().toISOString()}`);
    
    try {
      const stats = await notificationService.sendExpiringContractsNotifications();
      console.log('[CRON] ✅ Job completato con successo.');
      console.log('[CRON] 📊 Statistiche:', stats);
    } catch (error) {
      console.error('[CRON] ❌ Errore imprevisto durante l\'esecuzione del job:', error);
    }
  });
}

export default app;