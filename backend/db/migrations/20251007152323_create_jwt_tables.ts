import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("refresh_tokens", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.text("token").notNullable();
        table.index(["user_id", "token"]);
        table.timestamps(true, true);
    });

    await knex.schema.createTable("blacklisted_tokens", (table) => {
        table.increments("id").primary();
        table.text("token").notNullable().unique();
        table.timestamp("blacklisted_at").defaultTo(knex.fn.now());
        table.index("token");
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("refresh_tokens");
    await knex.schema.dropTable("blacklisted_tokens");
}