import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // Svuota la tabella notifications per evitare conflitti con i nuovi vincoli.
    // Essendo principalmente una coda transitoria, verrà ripopolata dalle scansioni cron future.
    await knex("notifications").del();

    return knex.schema.alterTable("notifications", (table) => {
        table.dropUnique(["contract_id", "type", "year"]);
        table.dropColumn("year");
        
        table.date("reference_date").notNullable();
        table.unique(["contract_id", "type", "reference_date"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex("notifications").del();

    return knex.schema.alterTable("notifications", (table) => {
        table.dropUnique(["contract_id", "type", "reference_date"]);
        table.dropColumn("reference_date");
        
        table.integer("year").nullable();
        table.unique(["contract_id", "type", "year"]);
    });
}
