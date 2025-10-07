import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("annuities", (table) => {
        table.increments("id").primary();
        table.integer("contract_id").unsigned().notNullable().references("id").inTable("contracts").onDelete("CASCADE");
        table.integer("year").notNullable();
        table.date("due_date").notNullable();
        table.boolean("is_paid").defaultTo(false);
        table.timestamp("paid_at").nullable();
        table.unique(["contract_id", "year"]);
        table.index("due_date");
        table.index(["contract_id", "is_paid"]);
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("annuities");
}