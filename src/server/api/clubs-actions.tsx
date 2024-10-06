"use server" // don't forget to add this!
import { isBefore, parseISO } from "date-fns"
import { eq } from "drizzle-orm"
import StripeWelcomeEmail from "emails/stripe-welcome"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { zfd } from "zod-form-data"
import { Routes } from "~/lib/routes"
import { authActionClient } from "~/lib/safe-action"
import { db } from "../db"
import {
	type SelectAnswer,
	answers as answersTable,
	clubAlbums,
	clubInvites,
	clubMembers,
	clubOpenInvites,
	clubQuestions,
	clubs,
	images,
	userClubAlbumProgress as userClubAlbumProgressTable,
} from "../db/schema"
import resend from "../resend"
import { acceptClubInvite } from "./mutations"
import { getClubMembership, getCurrentUser } from "./queries"
import * as Tasks from "./tasks"
import { Action } from "./tasks"
import { ActionError, DatabaseError, PGErrorCodes } from "./utils"

// This schema is used to validate input from client.
const createClubSchema = z.object({
	name: z.string().min(3).max(128),
	shortDescription: z.string().min(3).max(128),
	longDescription: z.string().min(3).max(2048),
	isPublic: z.boolean(),
})

export const createClub = authActionClient
	.metadata({ actionName: "createClub" })
	.schema(createClubSchema)
	.action(
		async ({
			parsedInput: { name, shortDescription, longDescription, isPublic },
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
						isPublic: isPublic,
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

			await Tasks.LogAction(Action.CreateClub, {
				userId,
				clubId: club.id,
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

				revalidatePath(`/clubs/${clubId}/settings/schedule`)
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

const removeAlbumFromClubSchema = z.object({
	clubAlbumId: z.number(),
	clubId: z.number(),
})

export const removeAlbumFromClub = authActionClient
	.metadata({ actionName: "removeAlbumFromClub" })
	.schema(removeAlbumFromClubSchema)
	.action(async ({ parsedInput: { clubAlbumId, clubId }, ctx: { userId } }) => {
		console.log("removeAlbumFromClub", clubAlbumId)
		const club = await db.query.clubs.findFirst({
			where: (club, { eq }) => eq(club.id, clubId),
		})

		if (!club) {
			throw new ActionError("Club not found")
		}

		if (club.ownedById !== userId) {
			throw new ActionError("You are not the owner of this club")
		}

		const clubAlbum = await db.query.clubAlbums.findFirst({
			where: (clubAlbums, { eq, and }) =>
				and(eq(clubAlbums.id, clubAlbumId), eq(clubAlbums.clubId, clubId)),
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

		await Tasks.LogAction(Action.JoinClub, {
			userId,
			clubId: club.id,
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
						listenedAt: hasListened ? new Date() : undefined,
					})
					.onConflictDoUpdate({
						target: [
							userClubAlbumProgressTable.userId,
							userClubAlbumProgressTable.clubAlbumId,
						],
						set: {
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
	isPublic: z.boolean(),
})

export const modifyClubMeta = authActionClient
	.metadata({ actionName: "modifyClubMeta" })
	.schema(modifyClubMetaSchema)
	.action(
		async ({
			parsedInput: {
				clubId,
				name,
				shortDescription,
				longDescription,
				isPublic,
			},
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
					isPublic,
				})
				.where(eq(clubs.id, clubId))

			revalidatePath(`/clubs/${clubId}/settings`)

			return { success: true }
		},
	)

const rescheduleAlbumSchema = z.object({
	clubAlbumId: z.number(),
	scheduledFor: z
		.string()
		.regex(
			/^\d{4}-\d{2}-\d{2}$/,
			"Invalid date format, should match yyyy-MM-dd",
		),
})

export const rescheduleAlbum = authActionClient
	.metadata({ actionName: "scheduleAlbum" })
	.schema(rescheduleAlbumSchema)
	.action(
		async ({ parsedInput: { clubAlbumId, scheduledFor }, ctx: { userId } }) => {
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

			if (clubMember.role !== "owner" && clubMember.role !== "admin") {
				throw new ActionError("You do not have permission to add albums")
			}

			try {
				const clubAlbumInsert = await db
					.update(clubAlbums)
					.set({ scheduledFor: scheduledFor })
					.where(eq(clubAlbums.id, clubAlbumId))
					.returning()
					.then(([clubAlbum]) => clubAlbum)

				revalidatePath(Routes.ClubSettings(clubAlbum.clubId, "schedule"))
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				return { clubAlbum: clubAlbumInsert! }
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

const inviteMembersSchema = z.object({
	clubId: z.number(),
	emails: z.array(z.string().email()),
})

export const inviteMembers = authActionClient
	.metadata({ actionName: "inviteMembers" })
	.schema(inviteMembersSchema)
	.action(async ({ parsedInput: { clubId, emails }, ctx: { userId } }) => {
		const currentUser = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq }) => eq(clubMember.userId, userId),
			with: {
				user: true,
			},
		})

		if (
			!currentUser ||
			(currentUser.role !== "owner" && currentUser.role !== "admin")
		) {
			throw new ActionError("You are not an admin of this club")
		}

		const club = await db.query.clubs.findFirst({
			where: (club, { eq }) => eq(club.id, clubId),
		})

		if (!club) {
			throw new ActionError("Club not found")
		}

		try {
			const invites = await db
				.insert(clubInvites)
				.values(
					emails.map((email) => ({
						clubId,
						email,
						createdById: userId,
					})),
				)
				.returning()

			revalidatePath(Routes.ClubSettings(clubId, "members"))

			const emailPromises = invites.map(async (invite) => {
				return resend.emails.send({
					from: "Record-Clubs <hello@record-clubs.com>",
					to: invite.email,
					subject: "Join our record club!",
					react: (
						<StripeWelcomeEmail
							inviter={currentUser.user.username}
							recordClubName={club.name}
							recordClubId={club.id}
							clubInvitePublicId={invite.publicId}
						/>
					),
				})
			})

			const results = await Promise.allSettled(emailPromises)

			results.forEach(async (result, index) => {
				if (result.status === "rejected") {
					console.error(result.reason)
					await db
						.update(clubInvites)
						.set({ sendFailedAt: new Date() })
						// biome-ignore lint/style/noNonNullAssertion: this must exists because we use a map on invites to create the promise.allSettled argument
						.where(eq(clubInvites.id, invites[index]!.id))
				}
				if (result.status === "fulfilled") {
					await db
						.update(clubInvites)
						.set({ sentAt: new Date(), emailId: result.value.data?.id })
						// biome-ignore lint/style/noNonNullAssertion: this must exists because we use a map on invites to create the promise.allSettled argument
						.where(eq(clubInvites.id, invites[index]!.id))
				}
			})

			return { invites }
		} catch (error) {
			console.error(error)
			throw new ActionError("Failed to invite members")
		}
	})

const revokeInviteSchema = z.object({
	clubInviteId: z.number(),
})

export const revokeInvite = authActionClient
	.metadata({ actionName: "revokeInvite" })
	.schema(revokeInviteSchema)
	.action(async ({ parsedInput: { clubInviteId }, ctx: { userId } }) => {
		const clubInvite = await db.query.clubInvites.findFirst({
			where: (clubInvite, { eq }) => eq(clubInvite.id, clubInviteId),
		})

		if (!clubInvite) {
			throw new ActionError("Club invite not found")
		}

		if (clubInvite.status === "accepted" || clubInvite.status === "declined") {
			throw new ActionError("Invite already accepted or declined")
		}

		if (clubInvite.revokedAt) {
			throw new ActionError("Invite already revoked")
		}

		const member = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq, and }) =>
				and(
					eq(clubMember.clubId, clubInvite.clubId),
					eq(clubMember.userId, userId),
				),
		})

		if (!member) {
			throw new ActionError("You are not a member of this club")
		}

		if (member.role !== "owner" && member.role !== "admin") {
			throw new ActionError("You do not have permission to revoke invites")
		}

		await db
			.update(clubInvites)
			.set({ revokedAt: new Date() })
			.where(eq(clubInvites.id, clubInviteId))

		revalidatePath(Routes.ClubSettings(clubInvite.clubId, "members"))

		return { success: true }
	})

const resendInviteSchema = z.object({
	clubInviteId: z.number(),
})

export const resendInvite = authActionClient
	.metadata({ actionName: "resendInvite" })
	.schema(resendInviteSchema)
	.action(async ({ parsedInput: { clubInviteId }, ctx: { userId } }) => {
		const clubInvite = await db.query.clubInvites.findFirst({
			where: (clubInvite, { eq }) => eq(clubInvite.id, clubInviteId),
		})

		if (!clubInvite) {
			throw new ActionError("Club invite not found")
		}

		const member = await db.query.clubMembers.findFirst({
			where: (clubMember, { eq, and }) =>
				and(
					eq(clubMember.clubId, clubInvite.clubId),
					eq(clubMember.userId, userId),
				),
		})

		if (!member) {
			throw new ActionError("You are not a member of this club")
		}

		if (member.role !== "owner" && member.role !== "admin") {
			throw new ActionError("You do not have permission to resend invites")
		}

		return { success: true }
	})

const acceptInviteSchema = zfd.formData({
	clubInviteId: zfd.numeric(),
})
export const acceptInvite = authActionClient
	.metadata({ actionName: "acceptInvite" })
	.schema(acceptInviteSchema)
	.action(async ({ parsedInput: { clubInviteId }, ctx: { userId } }) => {
		const user = await getCurrentUser(userId)

		// confirm user is is signed in & exists - this should only be hit if it's a brand new user
		if (!user) {
			throw new ActionError("User not found")
		}

		const clubInvite = await db.query.clubInvites.findFirst({
			where: (clubInvite, { eq }) => eq(clubInvite.id, clubInviteId),
		})

		if (!clubInvite) {
			throw new ActionError("Club invite not found")
		}

		const clubMembership = await getClubMembership(
			Number(clubInvite.clubId),
			userId,
		)

		// confirm user is not already an active member
		if (clubMembership && !clubMembership.inactiveAt) {
			throw new ActionError("You are already a member of this club")
		}

		// confirm user is not blocked
		if (clubMembership?.blockedAt) {
			throw new ActionError("You are blocked from this club")
		}

		// confirm invite exists and is for the current user
		if (clubInvite.email !== user.email) {
			throw new ActionError("Invite not found")
		}

		// confirm invite is not expired
		if (clubInvite.expiresAt < new Date()) {
			throw new ActionError("Invite expired")
		}

		await acceptClubInvite({
			userId,
			clubId: Number(clubInvite.clubId),
			inviteId: clubInvite.publicId,
		})

		revalidatePath(Routes.Home)
		redirect(`${Routes.Club(clubInvite.clubId)}?inviteAccepted=true`)
	})

const rejectInviteSchema = zfd.formData({
	clubInviteId: zfd.numeric(),
})
export const rejectInvite = authActionClient
	.metadata({ actionName: "rejectInvite" })
	.schema(rejectInviteSchema)
	.action(async ({ parsedInput: { clubInviteId }, ctx: { userId } }) => {
		const user = await getCurrentUser(userId)

		if (!user) {
			throw new ActionError("User not found")
		}

		const clubInvite = await db.query.clubInvites.findFirst({
			where: (clubInvite, { eq }) => eq(clubInvite.id, clubInviteId),
		})

		if (!clubInvite) {
			throw new ActionError("Club invite not found")
		}

		if (clubInvite.email !== user.email) {
			throw new ActionError("Invite not found")
		}

		await db
			.update(clubInvites)
			.set({
				declinedAt: new Date(),
				seenAt: new Date(),
			})
			.where(eq(clubInvites.id, clubInviteId))

		revalidatePath(Routes.Home)
		redirect(`${Routes.Home}?inviteRejected=true`)
	})

const createInviteLinkSchema = z.object({
	clubId: z.number(),
})

export const createInviteLink = authActionClient
	.metadata({ actionName: "createInviteLink" })
	.schema(createInviteLinkSchema)
	.action(async ({ parsedInput: { clubId }, ctx: { userId } }) => {
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

		const inviteLink = await db
			.insert(clubOpenInvites)
			.values({
				clubId,
			})
			.returning()

		revalidatePath(Routes.ClubSettings(clubId, "members"))

		return { inviteLink }
	})

const refreshOpenInviteLinkSchema = z.object({
	clubId: z.number(),
	openInviteId: z.number(),
})

export const refreshOpenInviteLink = authActionClient
	.metadata({ actionName: "refreshOpenInviteLink" })
	.schema(refreshOpenInviteLinkSchema)
	.action(
		async ({ parsedInput: { clubId, openInviteId }, ctx: { userId } }) => {
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

			const openInvite = await db.query.clubOpenInvites.findFirst({
				where: (openInvite, { eq, and, isNull }) =>
					and(eq(openInvite.id, openInviteId), isNull(openInvite.revokedAt)),
			})

			if (openInvite) {
				await db
					.update(clubOpenInvites)
					.set({ revokedAt: new Date() })
					.where(eq(clubOpenInvites.id, openInviteId))
			}

			const newOpenInvite = await db
				.insert(clubOpenInvites)
				.values({
					clubId,
				})
				.returning()

			revalidatePath(Routes.ClubSettings(clubId, "members"))

			return { openInvite: newOpenInvite }
		},
	)
