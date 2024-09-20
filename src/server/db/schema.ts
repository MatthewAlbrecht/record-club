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
  decimal,
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

export type QuestionCategory = (typeof questionCategoryEnum.enumValues)[number];

export const clubMemberRoleEnum = pgEnum("club_member_role", [
  "owner",
  "admin",
  "member",
]);

/**
 * Tables
 */

export const users = createTable(
  "user",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    username: varchar("username", { length: 20 }),
    email: varchar("email", { length: 256 }).notNull(),
    firstName: varchar("first_name", { length: 32 }),
    lastName: varchar("last_name", { length: 32 }),
    avatarUrl: varchar("avatar_url", { length: 256 }),
  },
  (user) => ({
    uniqueClerkId: uniqueIndex("unique_clerk_id").on(user.clerkId),
    uniqueUsername: uniqueIndex("unique_username").on(user.username),
  }),
);

export const clubs = createTable(
  "club",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    shortDescription: varchar("short_description", { length: 128 }).notNull(),
    longDescription: varchar("long_description", { length: 2048 }).notNull(),
    createdById: integer("created_by_id")
      .references(() => users.id)
      .notNull(),
    ownedById: integer("owned_by_id")
      .references(() => users.id)
      .notNull(),
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

export const albums = createTable(
  "album",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 256 }).notNull(),
    artist: varchar("artist", { length: 256 }).notNull(),
    releaseYear: integer("release_year"),
    releaseMonth: integer("release_month"),
    releaseDay: integer("release_day"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (album) => ({
    uniqueTitleArtist: uniqueIndex("unique_title_artist").on(
      album.title,
      album.artist,
    ),
  }),
);

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
    createdById: integer("created_by_id")
      .references(() => users.id)
      .notNull(),
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

export const answers = createTable("answer", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
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
  userClubAlbumProgressId: integer("user_club_album_progress_id")
    .references(() => userClubAlbumProgress.id)
    .notNull(),

  // Separate columns for different answer types
  answerShortText: varchar("answer_short_text", { length: 128 }),
  answerLongText: varchar("answer_long_text", { length: 2048 }),
  answerBoolean: boolean("answer_boolean"),
  answerNumber: decimal("answer_number", { precision: 3, scale: 1 }),
  answerColor: varchar("answer_color", { length: 7 }), // HEX

  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const clubMembers = createTable(
  "club_member",
  {
    id: serial("id").primaryKey(),
    clubId: integer("club_id")
      .references(() => clubs.id)
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    role: clubMemberRoleEnum("role").default("member").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => ({
    uniqueClubUser: uniqueIndex("unique_club_user").on(
      table.clubId,
      table.userId,
    ),
  }),
);

/**
 * New userClubAlbumProgress table to track user progress on clubAlbums.
 */
export const userClubAlbumProgress = createTable(
  "user_club_album_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    clubId: integer("club_id")
      .references(() => clubs.id)
      .notNull(),
    albumId: integer("album_id")
      .references(() => albums.id)
      .notNull(),
    clubAlbumId: integer("club_album_id")
      .references(() => clubAlbums.id)
      .notNull(),
    hasListened: boolean("has_listened").default(false).notNull(),
    listenedAt: timestamp("listened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => ({
    uniqueUserClubAlbum: uniqueIndex("unique_user_club_album").on(
      table.userId,
      table.clubAlbumId,
    ),
  }),
);

/**
 * Relations
 */

export const clubsRelations = relations(clubs, ({ many, one }) => ({
  clubAlbums: many(clubAlbums),
  clubMembers: many(clubMembers),
  createdBy: one(users, {
    fields: [clubs.createdById],
    references: [users.id],
  }),
  ownedBy: one(users, {
    fields: [clubs.ownedById],
    references: [users.id],
  }),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubMembers.userId],
    references: [users.id],
  }),
}));

export const clubAlbumsRelations = relations(clubAlbums, ({ one, many }) => ({
  album: one(albums, {
    fields: [clubAlbums.albumId],
    references: [albums.id],
  }),
  club: one(clubs, {
    fields: [clubAlbums.clubId],
    references: [clubs.id],
  }),
  userProgress: many(userClubAlbumProgress),
  createdBy: one(users, {
    fields: [clubAlbums.createdById],
    references: [users.id],
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
  userClubAlbumProgress: one(userClubAlbumProgress, {
    fields: [answers.userClubAlbumProgressId],
    references: [userClubAlbumProgress.id],
  }),
}));

export const userClubAlbumProgressRelations = relations(
  userClubAlbumProgress,
  ({ one, many }) => ({
    clubAlbum: one(clubAlbums, {
      fields: [userClubAlbumProgress.clubAlbumId],
      references: [clubAlbums.id],
    }),
    answers: many(answers),
    user: one(users, {
      fields: [userClubAlbumProgress.userId],
      references: [users.id],
    }),
  }),
);

/**
 * Types
 */

export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

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

export type SelectUserClubAlbumProgress = InferSelectModel<
  typeof userClubAlbumProgress
>;
export type InsertUserClubAlbumProgress = InferInsertModel<
  typeof userClubAlbumProgress
>;
