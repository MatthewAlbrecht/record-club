import { eq } from "drizzle-orm"

import { db } from "../db"
import { clubInvites, clubMembers } from "../db/schema"

export type AcceptClubInvite = Awaited<ReturnType<typeof acceptClubInvite>>
export const acceptClubInvite = async ({
	userId,
	clubId,
	inviteId,
}: {
	userId: string
	clubId: number
	inviteId: string
}) => {
	return db.transaction(async (tx) => {
		await tx
			.insert(clubMembers)
			.values({
				clubId: Number(clubId),
				userId,
			})
			.onConflictDoUpdate({
				target: [clubMembers.userId, clubMembers.clubId],
				set: {
					inactiveAt: null,
				},
			})

		await tx
			.update(clubInvites)
			.set({
				seenAt: new Date(),
				acceptedAt: new Date(),
			})
			.where(eq(clubInvites.publicId, inviteId))
	})
}

export type AcceptClubOpenInvite = Awaited<
	ReturnType<typeof acceptClubOpenInvite>
>
export const acceptClubOpenInvite = async ({
	userId,
	clubId,
}: {
	userId: string
	clubId: number
}) => {
	return db
		.insert(clubMembers)
		.values({
			clubId: Number(clubId),
			userId,
		})
		.onConflictDoUpdate({
			target: [clubMembers.userId, clubMembers.clubId],
			set: {
				inactiveAt: null,
			},
		})
}
