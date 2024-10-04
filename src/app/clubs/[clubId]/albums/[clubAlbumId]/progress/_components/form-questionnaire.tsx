"use client"

import { InfoIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { ColorPicker } from "~/components/ui/color-picker"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip"
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
			className="mx-auto"
			action={(formData) => {
				const answers = questions.map(({ id }) => {
					const answer = formData.get(`question-${id}`)
					return {
						clubQuestionId: id,
						answer: answer ? answer.toString() : null,
					}
				})

				console.log("HELLO", formData.get("action"))

				execute({
					clubAlbumId,
					answers,
					hasListened: formData.get("action") === "submit",
				})
			}}
		>
			<ul className=" grid grid-cols-1 gap-4">
				{questions.map(({ question, id: clubQuestionId }, index) => (
					<li key={question.id} className="flex flex-col py-2">
						<div>
							<Label className="flex items-center gap-2">
								{question.label}
								<Tooltip>
									<TooltipTrigger asChild>
										<InfoIcon className="size-4 text-slate-500" />
									</TooltipTrigger>
									<TooltipContent>
										<p>{question.text}</p>
									</TooltipContent>
								</Tooltip>
							</Label>
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
			<div className="mt-6 flex justify-end gap-2">
				<Button type="submit" variant="outline" name="action" value="save">
					Save for now
				</Button>
				<Button type="submit" name="action" value="submit">
					Submit and publish
				</Button>
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
			<InputNumber
				name={name}
				defaultValue={
					answer?.answerNumber != null ? answer.answerNumber : "5.0"
				}
			/>
		)
	}

	if (question.category === "color-picker") {
		return (
			<ColorPicker
				name={name}
				defaultValue={answer?.answerColor ?? undefined}
			/>
		)
	}

	return null
}

function InputNumber({
	name,
	defaultValue,
}: { name: string; defaultValue: string }) {
	const [value, setValue] = useState(defaultValue)

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.shiftKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
				e.preventDefault()
				const currentValue = Number.parseFloat(e.currentTarget.value)
				const newValue =
					e.key === "ArrowUp" ? currentValue + 1 : currentValue - 1
				const clampedValue = Math.min(Math.max(newValue, 0), 10)
				setValue(clampedValue.toFixed(1))
			}
		},
		[],
	)

	return (
		<Input
			type="number"
			name={name}
			step="0.1"
			min="0"
			max="10"
			value={value}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={handleKeyDown}
		/>
	)
}
