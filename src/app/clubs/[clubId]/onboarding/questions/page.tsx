import { notFound } from "next/navigation"
import { db } from "~/server/db"
import { FormRecordClubQuestionSelection } from "./form-record-club-question-selection"

export default async function ClubsCreatePage({
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

	const questions = await db.query.questions.findMany()

	return <FormRecordClubQuestionSelection questions={questions} club={club} />
}
