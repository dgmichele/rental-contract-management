import knex from "knex";
import * as dotenv from "dotenv";
import * as path from "path";

// Carica le variabili d'ambiente
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.dev";
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const db = knex({
  client: process.env.DB_CLIENT || "pg",
  connection: process.env.DB_URL || {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "rental_contract_management_dev",
  },
  pool: {
    min: 2,
    max: 10,
  },
});

export default db;