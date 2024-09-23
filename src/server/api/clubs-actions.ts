"use server" // don't forget to add this!

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { authActionClient } from "~/lib/safe-action"
import { db } from "../db"
import {
	type SelectAnswer,
	answers as answersTable,
	clubAlbums,
	clubMembers,
	clubQuestions,
	clubs,
	userClubAlbumProgress as userClubAlbumProgressTable,
} from "../db/schema"

// This schema is used to validate input from client.
const createClubSchema = z.object({
	name: z.string().min(3).max(128),
	shortDescription: z.string().min(3).max(128),
	longDescription: z.string().min(3).max(2048),
})

export const createClub = authActionClient
	.metadata({ actionName: "createClub" })
	.schema(createClubSchema)
	.action(
		async ({
			parsedInput: { name, shortDescription, longDescription },
			ctx: { userId },
		}) => {
			const club = await db.transaction(async (trx) => {
				const newClub = await trx
					.insert(clubs)
					.values({
						name,
						shortDescription,
						longDescription,
						createdById: userId,
						ownedById: userId,
					})
					.returning()

				await trx.insert(clubMembers).values({
					clubId: newClub[0]!.id,
					userId,
					role: "owner",
				})

				return newClub[0]!
			})

			return { club }
		},
	)

const addAlbumToClubSchema = z.object({
	clubId: z.number(),
	albumId: z.number(),
	scheduledFor: z
		.string()
		.regex(
			/^\d{4}-\d{2}-\d{2}$/,
			"Invalid date format, should match yyyy-MM-dd",
		),
})

export const addAlbumToClub = authActionClient
	.metadata({ actionName: "addAlbumToClub" })
	.schema(addAlbumToClubSchema)
	.action(
		async ({
			parsedInput: { clubId, albumId, scheduledFor },
			ctx: { userId },
		}) => {
			const club = await db.query.clubs.findFirst({
				where: (club, { eq }) => eq(club.id, clubId),
			})

			if (!club) {
				throw new ActionError("Club not found")
			}

			const membership = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq }) =>
					eq(clubMember.clubId, clubId) && eq(clubMember.userId, userId),
			})

			if (!membership) {
				throw new ActionError("You are not a member of this club")
			}

			if (membership.role !== "owner" && membership.role !== "admin") {
				throw new ActionError("You do not have permission to add albums")
			}

			try {
				const clubAlbumInsert = await db
					.insert(clubAlbums)
					.values({
						clubId,
						albumId,
						scheduledFor: scheduledFor,
						createdById: userId,
					})
					.returning()
					.then(([clubAlbum]) => clubAlbum)

				const newClubAlbum = await db.query.clubAlbums.findFirst({
					where: (clubAlbum, { eq }) => eq(clubAlbum.id, clubAlbumInsert!.id),
					with: {
						album: true,
					},
				})

				revalidatePath(`/clubs/${clubId}/settings`)
				return { clubAlbum: newClubAlbum! }
			} catch (error) {
				if (error instanceof Error) {
					throw new DatabaseError(
						{
							[PGErrorCodes.UniqueConstraintViolation]:
								"Cannot add multiple albums on the same day",
						},
						{ cause: error },
					)
				}
				throw Error
			}
		},
	)

const deleteAlbumSchema = z.object({
	clubAlbumId: z.number(),
})

import { isBefore, parseISO } from "date-fns"
import { ActionError, DatabaseError, PGErrorCodes } from "./utils"

export const deleteClubAlbum = authActionClient
	.metadata({ actionName: "deleteClubAlbum" })
	.schema(deleteAlbumSchema)
	.action(async ({ parsedInput: { clubAlbumId }, ctx: { userId } }) => {
		const club = await db.query.clubs.findFirst({
			where: (club, { eq }) => eq(club.id, clubAlbumId),
		})

		if (!club) {
			throw new ActionError("Club not found")
		}

		if (club.ownedById !== userId) {
			throw new ActionError("You are not the owner of this club")
		}

		const clubAlbum = await db.query.clubAlbums.findFirst({
			where: (clubAlbums, { eq }) => eq(clubAlbums.id, clubAlbumId),
		})

		if (!clubAlbum) {
			throw new ActionError("Album not found")
		}

		if (
			clubAlbum.scheduledFor &&
			isBefore(parseISO(clubAlbum.scheduledFor), new Date())
		) {
			throw new ActionError("Cannot delete an album scheduled in the past")
		}

		await db.delete(clubAlbums).where(eq(clubAlbums.id, clubAlbumId))
		revalidatePath("/clubs/new")
		revalidatePath(`/clubs/${clubAlbum.clubId}/settings`)
		return { success: true }
	})

const selectClubQuestionsSchema = z.object({
	questionIds: z.array(z.number()),
	clubId: z.number(),
})

export const selectClubQuestions = authActionClient
	.metadata({ actionName: "selectClubQuestions" })
	.schema(selectClubQuestionsSchema)
	.action(async ({ parsedInput: { questionIds, clubId }, ctx: { userId } }) => {
		const club = await db.query.clubs.findFirst({
			where: (club, { eq }) => eq(club.id, clubId),
		})

		if (!club) {
			throw new ActionError("Club not found")
		}

		if (club.ownedById !== userId) {
			throw new ActionError("You are not the owner of this club")
		}

		await db.transaction(async (trx) => {
			await trx.insert(clubQuestions).values(
				questionIds.map((questionId) => ({
					clubId,
					questionId,
					createdById: userId,
				})),
			)

			await trx
				.update(clubs)
				.set({ isActive: true })
				.where(eq(clubs.id, clubId))
		})

		return { success: true }
	})

const joinClubSchema = z.object({
	clubId: z.number(),
})

export const joinClubAction = authActionClient
	.metadata({ actionName: "joinClub" })
	.schema(joinClubSchema)
	.action(async ({ parsedInput: { clubId }, ctx: { userId } }) => {
		const club = await db.query.clubs.findFirst({
			where: (club, { eq }) => eq(club.id, clubId),
		})

		if (!club) {
			throw new ActionError("Club not found")
		}

		const clubMember = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq, and }) =>
				and(eq(clubMember.clubId, clubId), eq(clubMember.userId, userId)),
		})

		if (clubMember && clubMember.isActive) {
			throw new ActionError("You are already a member of this club")
		}

		if (clubMember && !clubMember.isActive) {
			await db
				.update(clubMembers)
				.set({ isActive: true })
				.where(eq(clubMembers.id, clubMember.id))

			revalidatePath(`/clubs/${clubId}`)
			return { club }
		}

		try {
			await db
				.insert(clubMembers)
				.values({
					clubId,
					userId,
					role: "member",
				})
				.returning()

			revalidatePath(`/clubs/${clubId}`)
			return { club }
		} catch (error) {
			if (error instanceof Error) {
				throw new DatabaseError(
					{
						[PGErrorCodes.UniqueConstraintViolation]:
							"You are already a member of this club",
					},
					{ cause: error },
				)
			}
			throw error
		}
	})

const leaveClubSchema = z.object({
	clubId: z.number(),
})

export const leaveClubAction = authActionClient
	.metadata({ actionName: "leaveClub" })
	.schema(leaveClubSchema)
	.action(async ({ parsedInput: { clubId }, ctx: { userId } }) => {
		const clubMember = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq }) =>
				eq(clubMember.clubId, clubId) && eq(clubMember.userId, userId),
			with: {
				club: true,
			},
		})

		if (!clubMember) {
			throw new ActionError("You are not a member of this club")
		}

		if (clubMember.role === "owner") {
			throw new ActionError("You cannot leave a club as an owner")
		}

		await db
			.update(clubMembers)
			.set({ isActive: false })
			.where(eq(clubMembers.id, clubMember.id))

		revalidatePath(`/clubs/${clubId}`)
		return { club: clubMember.club }
	})

const submitClubAlbumProgressSchema = z.object({
	clubAlbumId: z.number(),
	answers: z.array(
		z.object({
			clubQuestionId: z.number(),
			answer: z.string().nullable(),
		}),
	),
	hasListened: z.boolean(),
})

export const submitClubAlbumProgress = authActionClient
	.metadata({ actionName: "submitClubAlbumProgress" })
	.schema(submitClubAlbumProgressSchema)
	.action(
		async ({
			parsedInput: { clubAlbumId, answers, hasListened },
			ctx: { userId },
		}) => {
			const clubAlbum = await db.query.clubAlbums.findFirst({
				where: (clubAlbum, { eq }) => eq(clubAlbum.id, clubAlbumId),
			})

			if (!clubAlbum) {
				throw new ActionError("Club album not found")
			}

			// check if user is member of club
			const clubMember = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq }) =>
					eq(clubMember.clubId, clubAlbum.clubId) &&
					eq(clubMember.userId, userId),
			})

			if (!clubMember) {
				throw new ActionError("You are not a member of this club")
			}

			const clubQuestions = await db.query.clubQuestions.findMany({
				where: (clubQuestion, { eq, inArray }) =>
					inArray(
						clubQuestion.id,
						answers.map(({ clubQuestionId }) => clubQuestionId),
					),
				with: {
					question: true,
				},
			})

			const answerValues = answers
				.filter(({ answer }) => answer !== null)
				.map(({ clubQuestionId, answer }) => {
					const question = clubQuestions.find(({ id }) => id === clubQuestionId)
					const questionCategory = question?.question.category
					const questionId = question!.question.id

					const baseAnswer = {
						clubAlbumId,
						clubId: clubAlbum.clubId,
						albumId: clubAlbum.albumId,
						questionId: questionId,
						userId,
					} satisfies Partial<SelectAnswer>

					if (questionCategory === "short-answer") {
						return {
							...baseAnswer,
							answerShortText: answer,
						} satisfies Partial<SelectAnswer>
					} else if (questionCategory === "long-answer") {
						return {
							...baseAnswer,
							answerLongText: answer,
						} satisfies Partial<SelectAnswer>
					} else if (questionCategory === "true-false") {
						return {
							...baseAnswer,
							answerBoolean: answer === "true",
						} satisfies Partial<SelectAnswer>
					} else if (questionCategory === "number") {
						return {
							...baseAnswer,
							answerNumber: answer,
						} satisfies Partial<SelectAnswer>
					} else if (questionCategory === "color-picker") {
						return {
							...baseAnswer,
							answerColor: answer,
						} satisfies Partial<SelectAnswer>
					} else {
						throw new ActionError("Invalid question category")
					}
				})

			try {
				await db.transaction(async (trx) => {
					const userClubAlbumProgress = await trx
						.insert(userClubAlbumProgressTable)
						.values({
							clubAlbumId,
							userId,
							clubId: clubAlbum.clubId,
							albumId: clubAlbum.albumId,
							hasListened,
							listenedAt: hasListened ? new Date() : undefined,
						})
						.onConflictDoUpdate({
							target: [
								userClubAlbumProgressTable.userId,
								userClubAlbumProgressTable.clubAlbumId,
							],
							set: {
								hasListened,
								listenedAt: hasListened ? new Date() : undefined,
							},
						})
						.returning()

					const progressId = userClubAlbumProgress[0]!.id

					const updatedAnswerValues = answerValues.map((answer) => ({
						...answer,
						userClubAlbumProgressId: progressId,
					}))

					await trx.insert(answersTable).values(updatedAnswerValues)
				})

				return { success: true }
			} catch (error) {
				throw error
			}
		},
	)
