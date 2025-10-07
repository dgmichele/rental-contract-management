import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("notifications", (table) => {
        table.increments("id").primary();
        table.integer("contract_id").unsigned().notNullable().references("id").inTable("contracts").onDelete("CASCADE");
        table.enum("type", ["contract_renewal", "annuity_renewal"]).notNullable();
        table.integer("year").nullable();
        table.boolean("sent_to_client");
        table.boolean("sent_to_internal");
        table.timestamp("sent_at");
        table.unique(["contract_id", "type", "year"]);
        table.index("contract_id");
        table.index(["type", "sent_at"]);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("notifications");
}