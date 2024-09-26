"use server"

import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { db } from "../db"

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
							title: true,
							artist: true,
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
