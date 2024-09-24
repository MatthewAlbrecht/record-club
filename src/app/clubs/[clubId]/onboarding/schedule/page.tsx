import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "~/server/db"
import { clubAlbums } from "~/server/db/schema"
import { FormRecordClubCreateSchedule } from "./form-record-club-create-schedule"
import { auth } from "@clerk/nextjs/server"

export default async function ClubsOnboardingSchedulePage({
	params,
}: {
	params: { clubId: string }
}) {
	const user = auth()
	const clubId = Number(params.clubId)

	if (!user.userId) {
		return notFound()
	}

	const club = await db.query.clubs.findFirst({
		where: (club, { eq, and }) =>
			and(eq(club.id, Number(clubId)), eq(club.ownedById, user.userId)),
	})

	if (!club) {
		return notFound()
	}

	const clubAlbumsData = await db.query.clubAlbums.findMany({
		where: eq(clubAlbums.clubId, clubId),
		orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
		with: {
			album: true,
		},
	})

	if (!clubAlbumsData) {
		return notFound()
	}

	return (
		<FormRecordClubCreateSchedule clubAlbums={clubAlbumsData} club={club} />
	)
}
