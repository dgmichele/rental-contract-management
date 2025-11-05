import knex from "knex";

/**
 * Configurazione database con supporto per environment test, dev e production.
 * 
 * IMPORTANTE: Le variabili d'ambiente vengono caricate da server.ts o setup.ts,
 * NON caricare dotenv qui per evitare duplicazioni.
 */

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
  // Debug SQL disabilitato per evitare log verbosi
  debug: false,
});

export default db;