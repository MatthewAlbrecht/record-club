import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import {
	type GetClubWithAlbums,
	getActiveClubMemberById,
	getAllQuestions,
} from "~/server/api/queries"
import { FormClubModifyQuestions } from "./form-club-modify-questions"

export async function PageClubSettingsQuestions({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const membership = await getActiveClubMemberById(club.id, userId)

	if (!membership) {
		return notFound()
	}

	if (membership.role !== "owner") {
		return notFound()
	}

	const allQuestions = await getAllQuestions()

	const filteredQuestions = allQuestions.filter(
		(question) =>
			!club.questions.some(
				(clubQuestion) => clubQuestion.question.id === question.id,
			),
	)

	return (
		<>
			<h2 className="text-xl font-bold my-8">Questions</h2>
			<FormClubModifyQuestions club={club} questions={filteredQuestions} />
		</>
	)
}
