"use client"

import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import { submitClubAlbumProgress } from "~/server/api/clubs-actions"
import type {
	SelectAnswer,
	SelectClubQuestion,
	SelectQuestion,
} from "~/server/db/schema"

export function FormQuestionnaire({
	questions,
	answers,
	clubAlbumId,
	clubId,
}: {
	questions: (SelectClubQuestion & { question: SelectQuestion })[]
	clubAlbumId: number
	answers: SelectAnswer[]
	clubId: number
}) {
	const router = useRouter()
	const { execute } = useAction(submitClubAlbumProgress, {
		onSuccess: ({ input: { hasListened } }) => {
			if (hasListened) {
				toast.success("Album tracked")
				router.push(`/clubs/${clubId}/albums/${clubAlbumId}`)
			} else {
				toast.success("Progress updated")
			}
		},
	})

	const defaultValues = useMemo(() => {
		return answers.reduce(
			(acc, answer) => {
				acc[answer.questionId] = answer
				return acc
			},
			{} as Record<number, SelectAnswer>,
		)
	}, [answers])

	return (
		<form
			className="mt-4"
			action={(formData) => {
				const answers = questions.map(({ id }) => {
					const answer = formData.get(`question-${id}`)
					return {
						clubQuestionId: id,
						answer: answer ? answer.toString() : null,
					}
				})

				execute({
					clubAlbumId,
					answers,
					hasListened: formData.get("hasListened") === "on",
				})
			}}
		>
			<h2 className="font-bold text-xs uppercase">Questions</h2>
			<ul className="flex flex-col gap-4">
				<li className="flex flex-col py-2">
					<span className="text-muted-foreground text-xs">
						Finished listening
					</span>
					<div>
						<p className="mt-1">Have you finished listening to the album?</p>
						<div className="mt-2">
							<Switch name="hasListened" />
						</div>
					</div>
				</li>
				{questions.map(({ question, id: clubQuestionId }, index) => (
					<li key={question.id} className="flex flex-col py-2">
						<span className="text-muted-foreground text-xs">{index + 1}</span>
						<div>
							<p className="mt-1">{question.text}</p>
							<div className="mt-2">
								<QuestionBuilder
									question={question}
									clubQuestionId={clubQuestionId}
									answer={defaultValues[question.id]}
								/>
							</div>
						</div>
					</li>
				))}
			</ul>
			<div className="flex justify-end gap-2">
				<Button type="submit">Submit</Button>
			</div>
		</form>
	)
}

function QuestionBuilder({
	question,
	clubQuestionId,
	answer,
}: {
	question: SelectQuestion
	clubQuestionId: number
	answer: SelectAnswer | undefined
}) {
	const name = `question-${clubQuestionId}`

	if (question.category === "true-false") {
		return (
			<Switch
				name={name}
				defaultChecked={
					answer?.answerBoolean != null ? answer.answerBoolean : undefined
				}
			/>
		)
	}

	if (question.category === "short-answer") {
		return (
			<Input
				name={name}
				defaultValue={
					answer?.answerShortText != null ? answer.answerShortText : undefined
				}
			/>
		)
	}

	if (question.category === "long-answer") {
		return (
			<Textarea
				name={name}
				defaultValue={
					answer?.answerLongText != null ? answer.answerLongText : undefined
				}
			/>
		)
	}

	if (question.category === "number") {
		return (
			<Input
				type="number"
				name={name}
				step="0.1"
				min="0"
				max="10"
				defaultValue={
					answer?.answerNumber != null ? answer.answerNumber : undefined
				}
			/>
		)
	}

	if (question.category === "color-picker") {
		return (
			<Input
				type="color"
				name={name}
				defaultValue={
					answer?.answerColor != null ? answer.answerColor : undefined
				}
			/>
		)
	}

	return null
}
