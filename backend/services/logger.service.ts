import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Determina se siamo in produzione
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// ============= FORMATI =============

// Formato per console (colorato e leggibile)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Formato per file (JSON strutturato)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============= TRANSPORTS =============

const transports: winston.transport[] = [];

// In test mode, non logghiamo nulla (evita spam nei test)
if (!isTest) {
  // Console transport (sempre attivo in dev, opzionale in prod)
  if (!isProduction) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: 'debug', // Mostra tutto in dev
      })
    );
  }

  // File transport: Combined logs (tutti i log)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m', // Max 20MB per file
      maxFiles: '14d', // Mantieni 14 giorni
      format: fileFormat,
      level: 'info', // Info e superiori
    })
  );

  // File transport: Error logs (solo errori)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d', // Errori li teniamo 30 giorni
      format: fileFormat,
      level: 'error', // Solo errori
    })
  );

  // File transport: Cron logs (dedicato al cron job)
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'cron-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '30d',
      format: fileFormat,
      level: 'info',
    })
  );
}

// ============= LOGGER PRINCIPALE =============

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  transports,
  // Non uscire su errori non gestiti
  exitOnError: false,
});

// ============= LOGGER SPECIALIZZATO PER CRON =============

/**
 * Logger dedicato al cron job.
 * Scrive sia su cron.log che su combined.log
 */
export const cronLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  transports: isTest
    ? []
    : [
        // Scrive su cron.log
        new DailyRotateFile({
          filename: path.join('logs', 'cron-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '10m',
          maxFiles: '30d',
          format: fileFormat,
        }),
        // Scrive anche su combined per avere tutto in un posto
        new DailyRotateFile({
          filename: path.join('logs', 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: fileFormat,
        }),
        // Console in dev
        ...(isProduction
          ? []
          : [
              new winston.transports.Console({
                format: consoleFormat,
              }),
            ]),
      ],
  exitOnError: false,
});

// ============= HELPER FUNCTIONS =============

/**
 * Logga info generali
 */
export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

/**
 * Logga warning
 */
export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

/**
 * Logga errori
 */
export const logError = (message: string, error?: any) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.error(message, { error });
  }
};

/**
 * Logga debug (solo in dev)
 */
export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

/**
 * Logga eventi del cron job
 */
export const logCron = (message: string, meta?: any) => {
  cronLogger.info(message, meta);
};

/**
 * Logga errori del cron job
 */
export const logCronError = (message: string, error?: any) => {
  if (error instanceof Error) {
    cronLogger.error(message, {
      error: error.message,
      stack: error.stack,
    });
  } else {
    cronLogger.error(message, { error });
  }
};

// Export default logger per uso generico
export default logger;
