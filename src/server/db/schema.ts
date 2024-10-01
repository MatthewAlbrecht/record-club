// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import {
	boolean,
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTableCreator,
	serial,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"
export const createTable = pgTableCreator((name) => `record-club_${name}`)

/**
 * ----------------------------------------------------------------------------
 * Enums -----------------------------------------------------------------------
 */

export const clubTypeEnum = pgEnum("club_type", [
	"live",
	"self-paced-ordered",
	"self-paced-unordered",
])

export const questionCategoryEnum = pgEnum("question_category", [
	"short-answer",
	"long-answer",
	"true-false",
	"color-picker",
	"number",
])

export type QuestionCategory = (typeof questionCategoryEnum.enumValues)[number]

export const clubMemberRoleEnum = pgEnum("club_member_role", [
	"owner",
	"admin",
	"member",
])

export const releaseDatePrecisionEnum = pgEnum("release_date_precision", [
	"year",
	"month",
	"day",
])

export const albumTypeEnum = pgEnum("album_type", [
	"album",
	"single",
	"compilation",
])

export const clubInviteStatusEnum = pgEnum("club_invite_status", [
	"created",
	"sent",
	"revoked",
	"accepted",
	"declined",
	"seen",
])

/**
 * ----------------------------------------------------------------------------
 * Tables ---------------------------------------------------------------------
 */
export const users = createTable(
	"user",
	{
		id: varchar("id", { length: 256 }).primaryKey(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
			() => new Date(),
		),
		username: varchar("username", { length: 20 }).notNull(),
		email: varchar("email", { length: 256 }).notNull(),
		firstName: varchar("first_name", { length: 32 }),
		lastName: varchar("last_name", { length: 32 }),
		avatarUrl: varchar("avatar_url", { length: 256 }),
	},
	(user) => ({
		uniqueUsername: uniqueIndex("unique_username").on(user.username),
	}),
)

export const clubs = createTable(
	"club",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 256 }).notNull(),
		shortDescription: varchar("short_description", { length: 128 }).notNull(),
		longDescription: varchar("long_description", { length: 2048 }).notNull(),
		imageId: integer("image_id").references(() => images.id),
		createdById: varchar("created_by_id")
			.references(() => users.id)
			.notNull(),
		ownedById: varchar("owned_by_id")
			.references(() => users.id)
			.notNull(),
		clubType: clubTypeEnum("club_type").notNull().default("live"),
		isActive: boolean("is_active").default(false).notNull(),
		isPublic: boolean("is_public").default(true).notNull(),
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
)

export const albums = createTable(
	"album",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 256 }).notNull(),
		artistNames: varchar("artist_names", { length: 256 }).notNull(),
		releaseDate: varchar("release_date", { length: 16 }).notNull(),
		releaseDatePrecision: releaseDatePrecisionEnum("release_date_precision")
			.notNull()
			.default("day"),
		albumType: albumTypeEnum("album_type").notNull().default("album"),
		totalTracks: integer("total_tracks"),
		spotifyId: varchar("spotify_id", { length: 256 }),
		spotifyImageUrl: varchar("spotify_image_url", { length: 256 }),
		spotifyImageWidth: integer("spotify_image_width"),
		spotifyImageHeight: integer("spotify_image_height"),
		genres: text("genres").notNull().default("[]").$type<string[]>(),
		isrc: varchar("isrc", { length: 16 }),
		ean: varchar("ean", { length: 16 }),
		upc: varchar("upc", { length: 16 }),
		tracks: jsonb("tracks").notNull().default("[]").$type<
			{
				name: string
				preview_url: string | null
				duration_ms: number
				id: string
				track_number: number
			}[]
		>(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(album) => ({
		uniqueSpotifyId: uniqueIndex("unique_spotify_id").on(album.spotifyId),
	}),
)

export const questions = createTable("question", {
	id: serial("id").primaryKey(),
	text: varchar("text", { length: 256 }).notNull(),
	label: varchar("label", { length: 16 }).notNull(),
	category: questionCategoryEnum("category").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

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
		inactiveAt: timestamp("inactive_at", { withTimezone: true }),
		order: integer("order").notNull().default(0),
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
)

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
		scheduledFor: date("scheduled_for").notNull(),
		createdById: varchar("created_by_id")
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
)

export const answers = createTable("answer", {
	id: serial("id").primaryKey(),
	userId: varchar("user_id")
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
})

export const clubMembers = createTable(
	"club_member",
	{
		id: serial("id").primaryKey(),
		clubId: integer("club_id")
			.references(() => clubs.id)
			.notNull(),
		userId: varchar("user_id")
			.references(() => users.id)
			.notNull(),
		role: clubMemberRoleEnum("role").default("member").notNull(),
		inactiveAt: timestamp("inactive_at", { withTimezone: true }),
		blockedAt: timestamp("blocked_at", { withTimezone: true }),
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
)

export const userClubAlbumProgress = createTable(
	"user_club_album_progress",
	{
		id: serial("id").primaryKey(),
		userId: varchar("user_id")
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
)

export const images = createTable("image", {
	id: serial("id").primaryKey(),
	url: varchar("url", { length: 256 }).notNull(),
	focalPointX: integer("focal_point_x").default(50).notNull(),
	focalPointY: integer("focal_point_y").default(50).notNull(),
	key: varchar("key", { length: 256 }).notNull(),
	uploadedById: varchar("uploaded_by_id")
		.references(() => users.id)
		.notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

export const artists = createTable(
	"artist",
	{
		id: serial("id").primaryKey(),
		name: varchar("name", { length: 256 }).notNull(),
		spotifyId: varchar("spotify_id", { length: 256 }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => ({
		uniqueArtistSpotifyId: uniqueIndex("unique_artist_spotify_id").on(
			table.spotifyId,
		),
	}),
)

export const albumArtists = createTable(
	"album_artist",
	{
		id: serial("id").primaryKey(),
		albumId: integer("album_id")
			.references(() => albums.id)
			.notNull(),
		artistId: integer("artist_id")
			.references(() => artists.id)
			.notNull(),
	},
	(table) => ({
		uniqueAlbumArtist: uniqueIndex("unique_album_artist").on(
			table.albumId,
			table.artistId,
		),
	}),
)

export const clubInvites = createTable("club_invite", {
	id: serial("id").primaryKey(),
	publicId: uuid("public_id").defaultRandom().notNull(),
	clubId: integer("club_id")
		.references(() => clubs.id)
		.notNull(),
	emailId: uuid("email_id"),
	email: varchar("email", { length: 256 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP + INTERVAL '4 weeks'`)
		.notNull(),
	sentAt: timestamp("sent_at", { withTimezone: true }),
	sendFailedAt: timestamp("send_failed_at", { withTimezone: true }),
	acceptedAt: timestamp("accepted_at", { withTimezone: true }),
	declinedAt: timestamp("declined_at", { withTimezone: true }),
	seenAt: timestamp("seen_at", { withTimezone: true }),
	revokedAt: timestamp("revoked_at", { withTimezone: true }),
	createdById: varchar("created_by_id")
		.references(() => users.id)
		.notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	status: clubInviteStatusEnum("status")
		.notNull()
		.generatedAlwaysAs(sql`CASE
						WHEN "declined_at" IS NOT NULL THEN 'declined'::club_invite_status
						WHEN "accepted_at" IS NOT NULL THEN 'accepted'::club_invite_status
						WHEN "revoked_at" IS NOT NULL THEN 'revoked'::club_invite_status
						WHEN "seen_at" IS NOT NULL THEN 'seen'::club_invite_status
						WHEN "sent_at" IS NOT NULL THEN 'sent'::club_invite_status
						ELSE 'created'::club_invite_status
					END`),
})

export const clubOpenInvites = createTable("club_open_invite", {
	id: serial("id").primaryKey(),
	publicId: uuid("public_id").defaultRandom().notNull(),
	clubId: integer("club_id")
		.references(() => clubs.id)
		.notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

export const actionLogs = createTable("action_log", {
	id: serial("id").primaryKey(),
	action: varchar("action", { length: 256 }).notNull(),
	userId: varchar("user_id")
		.references(() => users.id)
		.notNull(),
	clubId: integer("club_id").references(() => clubs.id),
	clubAlbumId: integer("club_album_id").references(() => clubAlbums.id),
	userClubAlbumProgressId: integer("user_club_album_progress_id").references(
		() => userClubAlbumProgress.id,
	),
	metadata: jsonb("metadata")
		.notNull()
		.default("{}")
		.$type<Record<string, unknown>>(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
})

/**
 * -------------------------------------------------------------------------
 * Relations ---------------------------------------------------------------
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
	image: one(images, {
		fields: [clubs.imageId],
		references: [images.id],
	}),
	questions: many(clubQuestions),
}))

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
	club: one(clubs, {
		fields: [clubMembers.clubId],
		references: [clubs.id],
	}),
	user: one(users, {
		fields: [clubMembers.userId],
		references: [users.id],
	}),
}))

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
}))

export const clubQuestionsRelations = relations(clubQuestions, ({ one }) => ({
	question: one(questions, {
		fields: [clubQuestions.questionId],
		references: [questions.id],
	}),
	club: one(clubs, {
		fields: [clubQuestions.clubId],
		references: [clubs.id],
	}),
}))

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
}))

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
)

export const albumsRelations = relations(albums, ({ many }) => ({
	artists: many(albumArtists),
}))

export const artistsRelations = relations(artists, ({ many }) => ({
	albums: many(albumArtists),
}))

export const albumArtistsRelations = relations(albumArtists, ({ one }) => ({
	album: one(albums, {
		fields: [albumArtists.albumId],
		references: [albums.id],
	}),
	artist: one(artists, {
		fields: [albumArtists.artistId],
		references: [artists.id],
	}),
}))

export const clubInvitesRelations = relations(clubInvites, ({ one }) => ({
	club: one(clubs, {
		fields: [clubInvites.clubId],
		references: [clubs.id],
	}),
	createdBy: one(users, {
		fields: [clubInvites.createdById],
		references: [users.id],
	}),
}))

/**
 * ----------------------------------------------------------------------------
 * Types ----------------------------------------------------------------------
 */

export type SelectUser = InferSelectModel<typeof users>
export type InsertUser = InferInsertModel<typeof users>

export type SelectClub = InferSelectModel<typeof clubs>
export type InsertClub = InferInsertModel<typeof clubs>

export type SelectAlbum = InferSelectModel<typeof albums>
export type InsertAlbum = InferInsertModel<typeof albums>

export type SelectQuestion = InferSelectModel<typeof questions>
export type InsertQuestion = InferInsertModel<typeof questions>

export type SelectClubAlbum = InferSelectModel<typeof clubAlbums>
export type InsertClubAlbum = InferInsertModel<typeof clubAlbums>

export type SelectClubQuestion = InferSelectModel<typeof clubQuestions>
export type InsertClubQuestion = InferInsertModel<typeof clubQuestions>

export type SelectAnswer = InferSelectModel<typeof answers>
export type InsertAnswer = InferInsertModel<typeof answers>

export type SelectClubMember = InferSelectModel<typeof clubMembers>
export type InsertClubMember = InferInsertModel<typeof clubMembers>

export type SelectUserClubAlbumProgress = InferSelectModel<
	typeof userClubAlbumProgress
>
export type InsertUserClubAlbumProgress = InferInsertModel<
	typeof userClubAlbumProgress
>

export type SelectImage = InferSelectModel<typeof images>
export type InsertImage = InferInsertModel<typeof images>

export type SelectArtist = InferSelectModel<typeof artists>
export type InsertArtist = InferInsertModel<typeof artists>

export type SelectClubOpenInvite = InferSelectModel<typeof clubOpenInvites>
export type InsertClubOpenInvite = InferInsertModel<typeof clubOpenInvites>
