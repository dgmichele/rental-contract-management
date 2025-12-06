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
const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// ============= VALIDAZIONE VARIABILI D'AMBIENTE =============
const requiredEnvVars = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET', 'RESEND_API_KEY',
  'FRONTEND_URL', 'FROM_EMAIL', 'FROM_NAME',
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

// ============= MIDDLEWARE GLOBALI =============
app.use(requestLogger);
app.use(helmet());
console.log('[SERVER] ✅ Helmet configurato');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
console.log('[SERVER] ✅ CORS configurato per:', process.env.FRONTEND_URL);

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

// ============= ROTTA DI TEST =============
app.get('/test-server-live', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Server pronto 🥳');
});

// ============= IMPORT ROUTES CON LOGGING DETTAGLIATO =============
console.log('[SERVER] 📦 Inizio import routes...');

// Auth routes - TEST NUCLEARE
console.log('[SERVER] 1️⃣ Tentativo import auth.routes...');
try {
  const authRoutes = require('./routes/auth.routes');
  console.log('[SERVER] ✅ auth.routes importato, type:', typeof authRoutes);
  console.log('[SERVER] ✅ authRoutes.default exists?', !!authRoutes.default);
  
  const router = authRoutes.default || authRoutes;
  app.use('/api/auth', router);
  console.log('[SERVER] ✅✅✅ Route /api/auth MONTATE!');
} catch (error: any) {
  console.error('[SERVER] ❌❌❌ ERRORE IMPORT AUTH:');
  console.error('[SERVER] Message:', error.message);
  console.error('[SERVER] Stack:', error.stack);
}

// User routes
console.log('[SERVER] 2️⃣ Tentativo import user.routes...');
try {
  const userRoutes = require('./routes/user.routes');
  app.use('/api/user', userRoutes.default || userRoutes);
  console.log('[SERVER] ✅ Route /api/user montate');
} catch (error: any) {
  console.error('[SERVER] ❌ ERRORE user routes:', error.message);
}

// Owner routes
console.log('[SERVER] 3️⃣ Tentativo import owner.routes...');
try {
  const ownerRoutes = require('./routes/owner.routes');
  app.use('/api/owner', ownerRoutes.default || ownerRoutes);
  console.log('[SERVER] ✅ Route /api/owner montate');
} catch (error: any) {
  console.error('[SERVER] ❌ ERRORE owner routes:', error.message);
}

// Contract routes
console.log('[SERVER] 4️⃣ Tentativo import contract.routes...');
try {
  const contractRoutes = require('./routes/contract.routes');
  app.use('/api/contract', contractRoutes.default || contractRoutes);
  console.log('[SERVER] ✅ Route /api/contract montate');
} catch (error: any) {
  console.error('[SERVER] ❌ ERRORE contract routes:', error.message);
}

// Dashboard routes
console.log('[SERVER] 5️⃣ Tentativo import dashboard.routes...');
try {
  const dashboardRoutes = require('./routes/dashboard.routes');
  app.use('/api/dashboard', dashboardRoutes.default || dashboardRoutes);
  console.log('[SERVER] ✅ Route /api/dashboard montate');
} catch (error: any) {
  console.error('[SERVER] ❌ ERRORE dashboard routes:', error.message);
}

console.log('[SERVER] 📦 Import routes completato');

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

  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM ricevuto, chiusura graceful...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[SERVER] SIGINT ricevuto, chiusura graceful...');
    process.exit(0);
  });
}

// ============= CRON JOB =============
if (process.env.NODE_ENV !== 'test') {
  const cronTime = process.env.CRON_NOTIFICATION_TIME || '0 8 * * *';
  console.log(`[CRON] 🕐 Scheduler inizializzato: "${cronTime}"`);
  
  cron.schedule(cronTime, async () => {
    console.log(`[CRON] 🔔 Job notifiche: ${new Date().toISOString()}`);
    try {
      const stats = await notificationService.sendExpiringContractsNotifications();
      console.log('[CRON] ✅ Job completato:', stats);
    } catch (error) {
      console.error('[CRON] ❌ Errore job:', error);
    }
  });
}

export default app;