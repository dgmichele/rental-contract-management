import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("contracts", (table) => {
        table.increments("id").primary();
        table.integer("owner_id").unsigned().notNullable().references("id").inTable("owners").onDelete("CASCADE");
        table.integer("tenant_id").unsigned().notNullable().references("id").inTable("tenants").onDelete("CASCADE");
        table.date("start_date").notNullable();
        table.date("end_date").notNullable();
        table.boolean("cedolare_secca").notNullable();
        table.enum("typology", ["residenziale", "commerciale"]).notNullable();
        table.boolean("canone_concordato").notNullable();
        table.decimal("monthly_rent", 10, 2).notNullable();
        table.integer("last_annuity_paid").nullable();
        table.index(["owner_id", "end_date"]);
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("contracts");
}