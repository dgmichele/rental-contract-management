import express, { Application } from 'express';
import { errorHandler } from './middleware/errorHandler.middleware';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

// Carica le variabili d'ambiente in base a NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.dev';
dotenv.config({ path: path.resolve(__dirname, envFile) });

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

// Se mancano variabili d'ambiente obbligatorie, esci con errore
if (missingEnvVars.length > 0) {
  console.error('[SERVER] ❌ ERRORE: Variabili d\'ambiente mancanti:', missingEnvVars.join(', '));
  console.error('[SERVER] Controlla il file:', envFile);
  process.exit(1);
}

// Log variabili d'ambiente caricate (senza valori sensibili)
console.log('[SERVER] ✅ Variabili d\'ambiente caricate e validate');
console.log('[SERVER] Ambiente:', process.env.NODE_ENV || 'development');

// ============= INIZIALIZZAZIONE APP =============
const app: Application = express();
const PORT = process.env.PORT || 3000;

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
// Avvia il server solo se non siamo in ambiente di test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`[SERVER] 🚀 Server avviato su porta ${PORT}: http://localhost:${PORT}/`);
    console.log(`[SERVER] 🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] 📍 Health check: http://localhost:${PORT}/health`);
    console.log(`[SERVER] 🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log('='.repeat(50));
  });

  // ============= GRACEFUL SHUTDOWN =============
  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM ricevuto, chiusura graceful...');
    // Qui andrebbe la logica di chiusura delle connessioni (es. DB)
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('[SERVER] SIGINT ricevuto, chiusura graceful...');
    // Qui andrebbe la logica di chiusura delle connessioni (es. DB)
    process.exit(0);
  });
}

export default app;