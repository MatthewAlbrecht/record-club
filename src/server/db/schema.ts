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
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Table creator with schema prefix for multi-project schema support.
 */
export const createTable = pgTableCreator((name) => `record-club_${name}`);

/**
 * Enums
 */
export const clubTypeEnum = pgEnum("club_type", [
  "live",
  "self-paced-ordered",
  "self-paced-unordered",
]);

export const questionCategoryEnum = pgEnum("question_category", [
  "short-answer",
  "long-answer",
  "true-false",
  "color-picker",
  "number",
]);

/**
 * Tables
 */
export const clubs = createTable(
  "club",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    description: varchar("description", { length: 2048 }).notNull(),
    createdById: varchar("created_by_id", { length: 256 }).notNull(),
    ownedById: varchar("owned_by_id", { length: 256 }).notNull(),
    clubType: clubTypeEnum("club_type").notNull().default("live"),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (club) => ({
    nameIndex: index("name_idx").on(club.name),
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

export const questions = createTable("question", {
  id: serial("id").primaryKey(),
  text: varchar("text", { length: 256 }).notNull(),
  category: questionCategoryEnum("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

/**
 * New clubQuestions table to map clubs to their selected questions.
 */
export const clubQuestions = createTable(
  "club_question",
  {
    id: serial("id").primaryKey(),
    clubId: integer("club_id")
      .references(() => clubs.id)
      .notNull(),
    questionId: integer("question_id")
      .references(() => questions.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    uniqueClubQuestion: uniqueIndex("unique_club_question").on(
      table.clubId,
      table.questionId,
    ),
  }),
);

export const clubAlbums = createTable(
  "club_album",
  {
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
  },
  (clubAlbum) => ({
    uniqueClubScheduledFor: uniqueIndex("unique_club_scheduled_for").on(
      clubAlbum.clubId,
      clubAlbum.scheduledFor,
    ),
  }),
);

/**
 * Answers table to store users' responses to questions for each album.
 */
export const answers = createTable("answer", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  clubAlbumId: integer("club_album_id")
    .references(() => clubAlbums.id)
    .notNull(),
  clubId: integer("club_id")
    .references(() => clubs.id)
    .notNull(),
  albumId: integer("album_id")
    .references(() => albums.id)
    .notNull(),
  questionId: integer("question_id")
    .references(() => questions.id)
    .notNull(),

  // Separate columns for different answer types
  answerText: varchar("answer_text", { length: 2048 }),
  answerBoolean: boolean("answer_boolean"),
  answerNumber: integer("answer_number"),
  answerColor: varchar("answer_color", { length: 7 }), // e.g., "#FFFFFF"

  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

/**
 * Relations
 */
export const clubAlbumsRelations = relations(clubAlbums, ({ one }) => ({
  album: one(albums, {
    fields: [clubAlbums.albumId],
    references: [albums.id],
  }),
}));

export const clubQuestionsRelations = relations(clubQuestions, ({ one }) => ({
  question: one(questions, {
    fields: [clubQuestions.questionId],
    references: [questions.id],
  }),
  club: one(clubs, {
    fields: [clubQuestions.clubId],
    references: [clubs.id],
  }),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  club: one(clubs, {
    fields: [answers.clubId],
    references: [clubs.id],
  }),
  album: one(albums, {
    fields: [answers.albumId],
    references: [albums.id],
  }),
  clubAlbum: one(clubAlbums, {
    fields: [answers.clubAlbumId],
    references: [clubAlbums.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

/**
 * Types
 */
export type SelectClub = InferSelectModel<typeof clubs>;
export type InsertClub = InferInsertModel<typeof clubs>;

export type SelectAlbum = InferSelectModel<typeof albums>;
export type InsertAlbum = InferInsertModel<typeof albums>;

export type SelectQuestion = InferSelectModel<typeof questions>;
export type InsertQuestion = InferInsertModel<typeof questions>;

export type SelectClubAlbum = InferSelectModel<typeof clubAlbums>;
export type InsertClubAlbum = InferInsertModel<typeof clubAlbums>;

export type SelectClubQuestion = InferSelectModel<typeof clubQuestions>;
export type InsertClubQuestion = InferInsertModel<typeof clubQuestions>;

export type SelectAnswer = InferSelectModel<typeof answers>;
export type InsertAnswer = InferInsertModel<typeof answers>;
