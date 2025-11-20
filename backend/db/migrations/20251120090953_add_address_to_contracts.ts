import type { Knex } from "knex";
/**
 * Migration per aggiungere il campo 'address' alla tabella contracts.
 * Il campo è nullable per mantenere compatibilità con contratti esistenti.
 * 
 * IMPORTANTE: Esegui questa migration con:
 * npx knex migrate:make add_address_to_contracts --knexfile db/knexfile.ts -x ts
 * 
 * Poi copia questo contenuto nel file generato e esegui:
 * npm run migrate:latest
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("contracts", (table) => {
    table.string("address").nullable();
  });
}

/**
 * Rollback: rimuove il campo address
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("contracts", (table) => {
    table.dropColumn("address");
  });
}
