import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("owners", (table) => {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("surname").notNullable();
        table.string("phone");
        table.string("email");
        table.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.index("user_id");
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("owners");
}