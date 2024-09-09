// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  serial,
  timestamp,
  varchar,
  pgEnum,
  integer,
  date,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `record-club_${name}`);

export const clubTypeEnum = pgEnum("club_type", [
  "live",
  "self-paced-ordered",
  "self-paced-unordered",
]);

export const clubs = createTable(
  "club",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 2048 }).notNull(),
    createdById: varchar("created_by_id", { length: 256 }).notNull(),
    ownedById: varchar("owned_by_id", { length: 256 }).notNull(),
    clubType: clubTypeEnum("club_type").notNull().default("live"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  }),
);

export const albums = createTable("album", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  artist: varchar("artist", { length: 256 }).notNull(),
  releaseYear: integer("release_year"),
  releaseMonth: integer("release_month"),
  releaseDay: integer("release_day"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const clubAlbums = createTable("club_album", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id")
    .references(() => clubs.id)
    .notNull(),
  albumId: integer("album_id")
    .references(() => albums.id)
    .notNull(),
  scheduledFor: date("scheduled_for"),
  createdById: varchar("created_by_id", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type SelectClub = InferSelectModel<typeof clubs>;
export type InsertClub = InferInsertModel<typeof clubs>;
