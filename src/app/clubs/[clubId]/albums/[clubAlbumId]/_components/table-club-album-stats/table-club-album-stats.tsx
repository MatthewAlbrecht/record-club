"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "~/components/ui/data-table"
import type {
	QuestionCategory,
	SelectAnswer,
	SelectClubQuestion,
	SelectQuestion,
	SelectUser,
	SelectUserClubAlbumProgress,
} from "~/server/db/schema"

type Props = {
	clubQuestions: (SelectClubQuestion & { question: SelectQuestion })[]
	userProgressions: (SelectUserClubAlbumProgress & {
		answers: SelectAnswer[]
		user: SelectUser
	})[]
}

export function TableClubAlbumStats({
	clubQuestions,
	userProgressions,
}: Props) {
	const questionIdToCategoryMap = createQuestionIdToCategoryMap(clubQuestions)

	const columns = createColumnsDefs(clubQuestions)

	const normalizedData = userProgressions.map((userProgression) => {
		return {
			...userProgression,
			...createAnswerMap(userProgression.answers),
		}
	})

	function createAnswerMap(answers: SelectAnswer[]) {
		return answers.reduce(
			(acc, answer) => {
				acc[answer.questionId] = getValue(answer)
				return acc
			},
			{} as Record<number, string>,
		)
	}

	function getValue(answer: SelectAnswer) {
		const category = questionIdToCategoryMap[answer.questionId]

		switch (category) {
			case "short-answer":
				return answer.answerShortText ?? ""
			case "long-answer":
				return answer.answerLongText ?? ""
			case "true-false":
				return answer.answerBoolean?.toString() ?? ""
			case "number":
				return answer.answerNumber?.toString() ?? ""
			case "color-picker":
				return answer.answerColor ?? ""
			default:
				return ""
		}
	}

	return (
		<div className="container mx-auto py-10">
			<DataTable columns={columns} data={normalizedData} />
		</div>
	)
}

function createQuestionIdToCategoryMap(clubQuestions: Props["clubQuestions"]) {
	return clubQuestions.reduce(
		(acc, question) => {
			acc[question.questionId] = question.question.category
			return acc
		},
		{} as Record<number, QuestionCategory>,
	)
}

type ColumnDefs = ColumnDef<
	SelectUserClubAlbumProgress & { answers: SelectAnswer[]; user: SelectUser }
>[]

function createColumnsDefs(clubQuestions: Props["clubQuestions"]): ColumnDefs {
	const defs: ColumnDefs = clubQuestions.map((question) => ({
		accessorKey: question.questionId.toString(),
		header: question.question.label,
		cell: ({ row }) => {
			if (question.question.category === "color-picker") {
				return (
					<div
						className="flex h-10 w-10"
						style={{
							backgroundColor: row.getValue(question.questionId.toString()),
						}}
					/>
				)
			}

			return row.getValue(question.questionId.toString())
		},
	}))

	defs.unshift({
		accessorKey: "userId",
		header: "User",
		cell: ({ row }) => {
			return row.original.user.username
		},
	})

	return defs
}
