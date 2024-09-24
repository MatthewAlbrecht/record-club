import { notFound } from "next/navigation"
import { db } from "~/server/db"
import { FormRecordClubQuestionSelection } from "./form-record-club-question-selection"
import { auth } from "@clerk/nextjs/server"

export default async function ClubsCreatePage({
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

	const questions = await db.query.questions.findMany()

	return <FormRecordClubQuestionSelection questions={questions} club={club} />
}
