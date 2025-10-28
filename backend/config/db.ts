import knex from "knex";
import * as dotenv from "dotenv";
import * as path from "path";

/**
 * Configurazione database con supporto per environment test, dev e production.
 * Carica automaticamente il file .env corretto in base a NODE_ENV.
 */

// Determina quale file .env caricare
let envFile: string;

if (process.env.NODE_ENV === "test") {
  envFile = ".env.test";
} else if (process.env.NODE_ENV === "production") {
  envFile = ".env.production";
} else {
  envFile = ".env.dev";
}

// Carica le variabili d'ambiente
const envPath = path.resolve(__dirname, "..", envFile);
dotenv.config({ path: envPath });

console.log(`[DB_CONFIG] Caricamento env da: ${envFile}`);
console.log(`[DB_CONFIG] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[DB_CONFIG] DB_NAME: ${process.env.DB_NAME}`);

/**
 * Istanza Knex configurata per l'ambiente corrente.
 * In test usa il database separato per evitare conflitti con dev.
 */
const db = knex({
  client: process.env.DB_CLIENT || "pg",
  connection: process.env.DB_URL || {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 2,
    max: 10,
  },
  // IMPORTANTE: Abilita debug SQL solo in development, non in test per evitare log verbosi
  debug: process.env.NODE_ENV === "development" ? false : false,
});

export default db;