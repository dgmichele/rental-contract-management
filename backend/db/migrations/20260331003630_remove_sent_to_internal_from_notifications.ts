import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable("notifications", (table) => {
        table.dropColumn("sent_to_internal");
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable("notifications", (table) => {
        table.boolean("sent_to_internal");
    });
}
