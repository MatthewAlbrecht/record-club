"use server" // don't forget to add this!

import { and, eq } from "drizzle-orm"
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
	images,
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
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					clubId: newClub[0]!.id,
					userId,
					role: "owner",
				})

				// biome-ignore lint/style/noNonNullAssertion: <explanation>
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
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					where: (clubAlbum, { eq }) => eq(clubAlbum.id, clubAlbumInsert!.id),
					with: {
						album: true,
					},
				})

				revalidatePath(`/clubs/${clubId}/settings`)
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
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

		const existingClubMember = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq }) =>
				eq(clubMember.clubId, clubId) && eq(clubMember.userId, userId),
		})

		if (existingClubMember?.blockedAt) {
			throw new ActionError("You are blocked from this club")
		}

		await db
			.insert(clubMembers)
			.values({
				clubId,
				userId,
				role: "member",
			})
			.onConflictDoUpdate({
				target: [clubMembers.userId, clubMembers.clubId],
				set: { inactiveAt: null },
			})

		revalidatePath(`/clubs/${clubId}`)
		return { club }
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
			.set({ inactiveAt: new Date() })
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
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
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
					}
					if (questionCategory === "long-answer") {
						return {
							...baseAnswer,
							answerLongText: answer,
						} satisfies Partial<SelectAnswer>
					}
					if (questionCategory === "true-false") {
						return {
							...baseAnswer,
							answerBoolean: answer === "true",
						} satisfies Partial<SelectAnswer>
					}
					if (questionCategory === "number") {
						return {
							...baseAnswer,
							answerNumber: answer,
						} satisfies Partial<SelectAnswer>
					}
					if (questionCategory === "color-picker") {
						return {
							...baseAnswer,
							answerColor: answer,
						} satisfies Partial<SelectAnswer>
					}
					throw new ActionError("Invalid question category")
				})

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

				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				const progressId = userClubAlbumProgress[0]!.id

				const updatedAnswerValues = answerValues.map((answer) => ({
					...answer,
					userClubAlbumProgressId: progressId,
				}))

				await trx.insert(answersTable).values(updatedAnswerValues)
			})

			return { success: true }
		},
	)

const removeMemberFromClubSchema = z.object({
	clubId: z.number(),
	userId: z.string(),
})

export const removeMemberFromClub = authActionClient
	.metadata({ actionName: "removeMemberFromClub" })
	.schema(removeMemberFromClubSchema)
	.action(
		async ({
			parsedInput: { clubId, userId },
			ctx: { userId: currentUserId },
		}) => {
			const currentUser = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq }) => eq(clubMember.userId, currentUserId),
			})

			if (!currentUser) {
				throw new ActionError("You are not a member of this club")
			}

			if (currentUser.role !== "owner") {
				throw new ActionError("You are not an owner of this club")
			}

			const memberToRemove = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq, and }) =>
					and(eq(clubMember.clubId, clubId), eq(clubMember.userId, userId)),
			})

			if (!memberToRemove) {
				throw new ActionError("Member not found")
			}

			if (memberToRemove.role === "owner") {
				throw new ActionError("You cannot remove owners")
			}

			await db
				.update(clubMembers)
				.set({ inactiveAt: new Date(), role: "member" })
				.where(eq(clubMembers.id, memberToRemove.id))

			revalidatePath(`/clubs/${clubId}/settings`)
		},
	)

const blockMemberFromClubSchema = z.object({
	clubId: z.number(),
	userId: z.string(),
})

export const blockMemberFromClub = authActionClient
	.metadata({ actionName: "blockMemberFromClub" })
	.schema(blockMemberFromClubSchema)
	.action(
		async ({
			parsedInput: { clubId, userId },
			ctx: { userId: currentUserId },
		}) => {
			const currentUser = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq }) => eq(clubMember.userId, currentUserId),
			})

			if (!currentUser) {
				throw new ActionError("You are not a member of this club")
			}

			if (currentUser.role !== "owner") {
				throw new ActionError("You are not an owner of this club")
			}

			const memberToBlock = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq, and }) =>
					and(eq(clubMember.clubId, clubId), eq(clubMember.userId, userId)),
			})

			if (!memberToBlock) {
				throw new ActionError("Member not found")
			}

			await db
				.update(clubMembers)
				.set({ blockedAt: new Date(), role: "member" })
				.where(eq(clubMembers.id, memberToBlock.id))

			// TODO: Remove all club related data from user (club questions, albums, etc.)

			revalidatePath(`/clubs/${clubId}/settings`)
		},
	)

const changeMemberRoleSchema = z.object({
	clubId: z.number(),
	userId: z.string(),
	role: z.enum(["admin", "member"]),
})

export const changeMemberRole = authActionClient
	.metadata({ actionName: "changeMemberRole" })
	.schema(changeMemberRoleSchema)
	.action(
		async ({
			parsedInput: { clubId, userId, role },
			ctx: { userId: currentUserId },
		}) => {
			const currentUser = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq }) => eq(clubMember.userId, currentUserId),
			})

			if (!currentUser) {
				throw new ActionError("You are not a member of this club")
			}

			if (currentUser.role !== "owner") {
				throw new ActionError("You are not an owner of this club")
			}

			const memberToChange = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq, and }) =>
					and(eq(clubMember.clubId, clubId), eq(clubMember.userId, userId)),
			})

			if (!memberToChange) {
				throw new ActionError("Member not found")
			}

			if (memberToChange.role === "owner") {
				throw new ActionError("You cannot change the role of an owner")
			}

			await db
				.update(clubMembers)
				.set({ role })
				.where(eq(clubMembers.id, memberToChange.id))

			revalidatePath(`/clubs/${clubId}/settings`)
			return { role }
		},
	)

const updateClubImageFocalPointSchema = z.object({
	clubId: z.number(),
	x: z.number(),
	y: z.number(),
})

export const updateClubImageFocalPoint = authActionClient
	.metadata({ actionName: "updateClubImageFocalPoint" })
	.schema(updateClubImageFocalPointSchema)
	.action(async ({ parsedInput: { clubId, x, y }, ctx: { userId } }) => {
		const currentUser = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq }) => eq(clubMember.userId, userId),
		})

		if (!currentUser || currentUser.role !== "owner") {
			throw new ActionError("You are not an owner of this club")
		}

		const club = await db.query.clubs.findFirst({
			where: (club, { eq }) => eq(club.id, clubId),
		})

		if (!club) {
			throw new ActionError("Club not found")
		}

		if (!club.imageId) {
			throw new ActionError("Club image not found")
		}

		await db
			.update(images)
			.set({ focalPointX: Math.round(x), focalPointY: Math.round(y) })
			.where(eq(images.id, club.imageId))

		revalidatePath(`/clubs/${clubId}`)

		return { success: true }
	})

const OrderConstants = {
	HIDDEN_QUESTION: 999,
	NEWLY_ADDED: 998,
}

const hideQuestionFromClubSchema = z.object({
	clubId: z.number(),
	clubQuestionId: z.number(),
})

export const hideQuestionFromClub = authActionClient
	.metadata({ actionName: "hideQuestionFromClub" })
	.schema(hideQuestionFromClubSchema)
	.action(
		async ({ parsedInput: { clubId, clubQuestionId }, ctx: { userId } }) => {
			const currentUser = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq, and }) =>
					and(eq(clubMember.userId, userId), eq(clubMember.clubId, clubId)),
			})

			if (!currentUser || currentUser.role !== "owner") {
				throw new ActionError("You are not an owner of this club")
			}

			const question = await db.query.clubQuestions.findFirst({
				where: (clubQuestion, { eq }) => eq(clubQuestion.id, clubQuestionId),
			})

			if (!question) {
				throw new ActionError("Question not found")
			}

			await db
				.update(clubQuestions)
				.set({
					inactiveAt: new Date(),
					order: OrderConstants.HIDDEN_QUESTION,
				})
				.where(eq(clubQuestions.id, clubQuestionId))

			revalidatePath(`/clubs/${clubId}/settings/questions`)

			return { success: true }
		},
	)

const reorderClubQuestionsSchema = z.object({
	clubId: z.number(),
	clubQuestionIds: z.array(z.number()),
})

export const reorderClubQuestions = authActionClient
	.metadata({ actionName: "reorderClubQuestions" })
	.schema(reorderClubQuestionsSchema)
	.action(
		async ({ parsedInput: { clubId, clubQuestionIds }, ctx: { userId } }) => {
			const currentUser = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq, and }) =>
					and(eq(clubMember.userId, userId), eq(clubMember.clubId, clubId)),
			})

			if (!currentUser || currentUser.role !== "owner") {
				throw new ActionError("You are not an owner of this club")
			}

			const clubQuestionUpdates = clubQuestionIds.map(
				(clubQuestionId, index) => ({
					id: clubQuestionId,
					order: index + 1,
				}),
			)

			console.log("clubQuestionUpdates", clubQuestionUpdates)

			await db.transaction(async (trx) => {
				for (const clubQuestionUpdate of clubQuestionUpdates) {
					await trx
						.update(clubQuestions)
						.set({ order: clubQuestionUpdate.order })
						.where(eq(clubQuestions.id, clubQuestionUpdate.id))
				}
			})

			return { success: true }
		},
	)

const addQuestionToClubSchema = z.object({
	clubId: z.number(),
	questionId: z.number(),
})

export const addQuestionToClub = authActionClient
	.metadata({ actionName: "addQuestionToClub" })
	.schema(addQuestionToClubSchema)
	.action(async ({ parsedInput: { clubId, questionId }, ctx: { userId } }) => {
		const currentUser = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq, and }) =>
				and(eq(clubMember.userId, userId), eq(clubMember.clubId, clubId)),
		})

		if (!currentUser || currentUser.role !== "owner") {
			throw new ActionError("You are not an owner of this club")
		}

		const question = await db.query.questions.findFirst({
			where: (question, { eq }) => eq(question.id, questionId),
		})

		if (!question) {
			throw new ActionError("Question not found")
		}

		await db
			.insert(clubQuestions)
			.values({
				clubId,
				questionId,
				order: OrderConstants.NEWLY_ADDED,
			})
			.onConflictDoUpdate({
				target: [clubQuestions.clubId, clubQuestions.questionId],
				set: { order: OrderConstants.NEWLY_ADDED, inactiveAt: null },
			})

		revalidatePath(`/clubs/${clubId}/settings/questions`)
		revalidatePath(`/clubs/${clubId}/settings`)

		return { success: true }
	})

const modifyClubMetaSchema = z.object({
	clubId: z.number(),
	name: z.string().min(1),
	shortDescription: z.string().min(3),
	longDescription: z.string().min(3),
})

export const modifyClubMeta = authActionClient
	.metadata({ actionName: "modifyClubMeta" })
	.schema(modifyClubMetaSchema)
	.action(
		async ({
			parsedInput: { clubId, name, shortDescription, longDescription },
			ctx: { userId },
		}) => {
			const currentUser = await db.query.clubMembers.findFirst({
				where: (clubMember, { eq, and }) =>
					and(eq(clubMember.userId, userId), eq(clubMember.clubId, clubId)),
			})

			if (!currentUser || currentUser.role !== "owner") {
				throw new ActionError("You are not an owner of this club")
			}

			await db
				.update(clubs)
				.set({
					name,
					shortDescription,
					longDescription,
				})
				.where(eq(clubs.id, clubId))

			revalidatePath(`/clubs/${clubId}/settings`)

			return { success: true }
		},
	)
