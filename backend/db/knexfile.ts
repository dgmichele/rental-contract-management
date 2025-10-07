import type { Knex } from "knex";
import * as dotenv from "dotenv";
import * as path from "path";

// Carica .env.dev per sviluppo locale (il file è nella root, noi siamo in /db)
dotenv.config({ path: path.resolve(__dirname, "..", ".env.dev") });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: process.env.DB_CLIENT || "pg",
    connection: {
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
    migrations: {
      tableName: "knex_migrations",
      directory: path.resolve(__dirname, "migrations"),
      extension: "ts",
    },
    seeds: {
      directory: path.resolve(__dirname, "seeds"),
      extension: "ts",
    },
  },

  production: {
    client: process.env.DB_CLIENT || "pg",
    connection: process.env.DB_URL || {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: path.resolve(__dirname, "migrations"),
      extension: "ts",
    },
    seeds: {
      directory: path.resolve(__dirname, "seeds"),
      extension: "ts",
    },
  },
};

export default config;