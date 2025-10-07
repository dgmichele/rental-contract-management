import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("password_reset_tokens", (table) => {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("token").notNullable().unique();
        table.timestamp("expires_at").notNullable();
        table.boolean("used").defaultTo(false);
        table.index("token");
        table.index(["user_id", "used"]);
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("password_reset_tokens");
}