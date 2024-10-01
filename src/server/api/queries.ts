"use server"

import { auth } from "@clerk/nextjs/server"
import { format } from "date-fns"
import { and, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "../db"
import { clubMembers, clubs, images } from "../db/schema"

export type GetClubMembers = Awaited<ReturnType<typeof getClubMembers>>
export const getClubMembers = async (clubId: number) => {
	const { userId } = auth()

	if (!userId) {
		notFound()
	}

	const clubAdmin = await db.query.clubMembers.findFirst({
		where: (clubMembers, { eq, and, isNull, inArray }) =>
			and(
				eq(clubMembers.clubId, clubId),
				eq(clubMembers.userId, userId),
				isNull(clubMembers.inactiveAt),
				isNull(clubMembers.blockedAt),
				inArray(clubMembers.role, ["owner", "admin"]),
			),
	})

	if (!clubAdmin) {
		notFound()
	}

	const clubMembers = await db.query.clubMembers.findMany({
		where: (clubMembers, { eq, and }) => and(eq(clubMembers.clubId, clubId)),
		with: {
			user: true,
		},
	})

	if (!clubMembers) {
		notFound()
	}

	return clubMembers
}

export type GetClubWithAlbums = Awaited<ReturnType<typeof getClubWithAlbums>>
export async function getClubWithAlbums(clubId: number) {
	return db.query.clubs.findFirst({
		where: (clubs, { eq }) => eq(clubs.id, clubId),
		with: {
			questions: {
				with: {
					question: true,
				},
				orderBy: (clubQuestions, { asc }) => [asc(clubQuestions.order)],
				where: (clubQuestions, { isNull }) => isNull(clubQuestions.inactiveAt),
			},
			image: true,
			clubAlbums: {
				columns: {
					id: true,
					scheduledFor: true,
				},
				orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
				with: {
					album: {
						columns: {
							id: true,
							name: true,
							artistNames: true,
							spotifyImageUrl: true,
						},
					},
				},
			},
		},
	})
}

export type GetActiveClubMemberById = Awaited<
	ReturnType<typeof getActiveClubMemberById>
>
export const getActiveClubMemberById = async (
	clubId: number,
	userId: string,
) => {
	return db.query.clubMembers.findFirst({
		where: (clubMembers, { eq, and, isNull }) =>
			and(
				eq(clubMembers.clubId, clubId),
				eq(clubMembers.userId, userId),
				isNull(clubMembers.inactiveAt),
				isNull(clubMembers.blockedAt),
			),
	})
}

export type GetAllQuestions = Awaited<ReturnType<typeof getAllQuestions>>
export const getAllQuestions = async () => {
	return db.query.questions.findMany()
}

export type GetPublicClubsImNotAMemberOf = Awaited<
	ReturnType<typeof getPublicClubsImNotAMemberOf>
>
export const getPublicClubsImNotAMemberOf = async (userId: string) => {
	return db.query.clubs.findMany({
		where: (clubs, { not, inArray, eq, and }) =>
			and(
				not(
					inArray(
						clubs.id,
						db
							.select({ id: clubMembers.clubId })
							.from(clubMembers)
							.where(eq(clubMembers.userId, userId)),
					),
				),
				eq(clubs.isPublic, true),
			),
		with: {
			image: true,
		},
	})
}

export type GetClubInvites = Awaited<ReturnType<typeof getClubInvites>>
export const getClubInvites = async (clubId: number) => {
	return db.query.clubInvites.findMany({
		where: (clubInvites, { eq }) => eq(clubInvites.clubId, clubId),
	})
}

export type GetCurrentUser = Awaited<ReturnType<typeof getCurrentUser>>
export const getCurrentUser = async (userId: string) => {
	return db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, userId),
	})
}

export type GetClubMembership = Awaited<ReturnType<typeof getClubMembership>>
export const getClubMembership = async (clubId: number, userId: string) => {
	return db.query.clubMembers.findFirst({
		where: (clubMembers, { eq, and }) =>
			and(eq(clubMembers.clubId, clubId), eq(clubMembers.userId, userId)),
	})
}

export type GetClubInvite = Awaited<ReturnType<typeof getClubInvite>>
export const getClubInvite = async (publicId: string) => {
	return db.query.clubInvites.findFirst({
		where: (clubInvites, { eq }) => eq(clubInvites.publicId, publicId),
	})
}

export type GetUserClubs = Awaited<ReturnType<typeof getUserClubs>>
export const getUserClubs = async (userId: string) => {
	return db
		.select()
		.from(clubMembers)
		.innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
		.leftJoin(images, eq(clubs.imageId, images.id))
		.where(
			and(eq(clubMembers.userId, userId.toString()), eq(clubs.isActive, true)),
		)
}

export type GetUpcomingAlbums = Awaited<ReturnType<typeof getUpcomingAlbums>>

/* TODO @matthewalbrecht: this query is slow and should be optimized */
export const getUpcomingAlbums = async (clubIds: number[], userId: string) => {
	const formattedToday = format(new Date(), "yyyy-MM-dd")
	return db.query.clubAlbums.findMany({
		where: (clubAlbums, { and, gte, inArray }) =>
			and(
				inArray(clubAlbums.clubId, clubIds),
				gte(clubAlbums.scheduledFor, formattedToday),
			),
		with: {
			album: true,
			club: {
				columns: {
					id: true,
					name: true,
				},
			},
			userProgress: {
				where: (userProgress, { eq }) => eq(userProgress.userId, userId),
			},
		},
		orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
	})
}

export type GetOpenClubInvites = Awaited<ReturnType<typeof getOpenClubInvites>>
export const getOpenClubInvites = async (userId: string) => {
	const user = await getCurrentUser(userId)

	if (!user) {
		notFound()
	}

	const memberships = await db.query.clubMembers.findMany({
		where: (clubMembers, { eq, and, isNull }) =>
			and(eq(clubMembers.userId, userId), isNull(clubMembers.inactiveAt)),
		columns: {
			clubId: true,
		},
	})

	const blockedMemberships = await db.query.clubMembers.findMany({
		where: (clubMembers, { eq, and, isNotNull }) =>
			and(eq(clubMembers.userId, userId), isNotNull(clubMembers.blockedAt)),
		columns: {
			clubId: true,
		},
	})

	const clubIds = memberships.map(({ clubId }) => clubId)
	const blockedClubIds = blockedMemberships.map(({ clubId }) => clubId)

	return db.query.clubInvites.findMany({
		where: (clubInvites, { eq, and, inArray, notInArray }) =>
			and(
				eq(clubInvites.email, user.email),
				inArray(clubInvites.status, ["created", "sent", "seen"]),
				notInArray(clubInvites.clubId, clubIds),
				notInArray(clubInvites.clubId, blockedClubIds),
			),
		with: {
			club: {
				columns: {
					id: true,
					name: true,
					imageId: true,
					shortDescription: true,
				},
				with: {
					image: true,
				},
			},
		},
	})
}

export type GetClubOpenInvite = Awaited<ReturnType<typeof getClubOpenInvite>>
export const getClubOpenInvite = async (clubId: number) => {
	return db.query.clubOpenInvites.findFirst({
		where: (clubOpenInvite, { eq, and, isNull }) =>
			and(eq(clubOpenInvite.clubId, clubId), isNull(clubOpenInvite.revokedAt)),
	})
}

export type GetClubOpenInviteByPublicId = Awaited<
	ReturnType<typeof getClubOpenInviteByPublicId>
>
export const getClubOpenInviteByPublicId = async (publicId: string) => {
	return db.query.clubOpenInvites.findFirst({
		where: (clubOpenInvite, { eq }) => eq(clubOpenInvite.publicId, publicId),
	})
}
