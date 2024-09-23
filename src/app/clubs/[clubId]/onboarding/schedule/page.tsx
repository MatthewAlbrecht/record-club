import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "~/server/db"
import { clubAlbums } from "~/server/db/schema"
import { FormRecordClubCreateSchedule } from "./form-record-club-create-schedule"

export default async function ClubsOnboardingSchedulePage({
	params,
}: {
	params: { clubId: string }
}) {
	const clubId = Number(params.clubId)

	const club = await db.query.clubs.findFirst({
		where: (club, { eq }) => eq(club.id, Number(clubId)),
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
