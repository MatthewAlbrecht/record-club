"use client"

import { closestCorners } from "@dnd-kit/core"
import { AlertCircleIcon, GripVerticalIcon, Trash } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { DataTable } from "~/components/ui/data-table"
import { DialogConfirmation } from "~/components/ui/dialog-confirmation"
import {
	Sortable,
	SortableDragHandle,
	SortableItem,
} from "~/components/ui/sortable"
import { useDebounce } from "~/lib/hooks/useDebounce"
import {
	hideQuestionFromClub,
	reorderClubQuestions,
} from "~/server/api/clubs-actions"
import type { GetAllQuestions, GetClubWithAlbums } from "~/server/api/queries"
import { columns } from "./data-table-club-questions/columns-table-club-questions"
import { TableClubQuestions } from "./data-table-club-questions/table-club-questions"

export function FormClubModifyQuestions({
	club,
	questions,
}: {
	club: NonNullable<GetClubWithAlbums>
	questions: NonNullable<GetAllQuestions>
}) {
	const [clubQuestions, setClubQuestions] = useState(club.questions)
	const { execute: executeReorderQuestions, isExecuting } = useAction(
		reorderClubQuestions,
		{
			onExecute: () => {
				toast("Saving order...")
			},
			onSuccess: () => {
				toast.success("Questions reordered")
			},
			onError: ({ error }) => {
				if (typeof error.serverError === "string") {
					toast.error(error.serverError)
				} else {
					toast.error("Unable to reorder questions")
				}
			},
		},
	)

	const debouncedExecuteReorderQuestions = useDebounce(
		(...args: Parameters<typeof executeReorderQuestions>) => {
			console.log(
				"value being sent to server",
				args[0].clubQuestionIds.map(
					(clubQuestionId) =>
						clubQuestions.find((question) => question.id === clubQuestionId)
							?.question.label,
				),
			)
			executeReorderQuestions(...args)
		},
		1000,
	)

	useEffect(() => {
		setClubQuestions(club.questions)
	}, [club.questions])

	// Add this function to handle drag start
	function handleDragStart() {
		debouncedExecuteReorderQuestions.cancel()
	}

	function handleValueChange(value: typeof clubQuestions) {
		setClubQuestions(value)

		debouncedExecuteReorderQuestions({
			clubId: club.id,
			clubQuestionIds: value.map((clubQuestion) => clubQuestion.id),
		})
	}

	return (
		<div className="max-w-2xl flex flex-col gap-y-10">
			<div>
				<h1 className="text-base font-semibold leading-7 text-slate-900">
					Reorder questions
				</h1>
				<p className="mt-1 text-sm leading-6 text-slate-600">
					Drag and drop the questions to reorder them. This order will be used
					when the questions are displayed to the members.
				</p>

				<Sortable
					value={clubQuestions}
					onValueChange={handleValueChange}
					collisionDetection={closestCorners}
					orientation="vertical"
					disabled={isExecuting}
					onDragStart={handleDragStart}
				>
					<ul
						className="divide-y mt-4 data-[disabled=true]:opacity-50"
						data-disabled={isExecuting}
						aria-disabled={isExecuting}
					>
						{clubQuestions.map((question, index) => (
							<SortableItem key={question.id} value={question.id}>
								<QuestionListItem
									question={question}
									index={index}
									club={club}
								/>
							</SortableItem>
						))}
					</ul>
				</Sortable>
			</div>
			<div>
				<TableClubQuestions club={club} questions={questions} />
			</div>
		</div>
	)
}

function QuestionListItem({
	question,
	index,
	club,
}: {
	question: NonNullable<GetClubWithAlbums>["questions"][number]
	index: number
	club: NonNullable<GetClubWithAlbums>
}) {
	const [dialogOpen, setDialogOpen] = useState(false)
	const {
		execute: executeHideQuestion,
		isExecuting,
		isTransitioning,
	} = useAction(hideQuestionFromClub, {
		onSuccess: () => {
			toast.success("Question hidden")
			setDialogOpen(false)
		},
		onError: ({ error }) => {
			if (typeof error.serverError === "string") {
				toast.error(error.serverError)
			} else {
				toast.error("Unable to hide question")
			}
			setDialogOpen(false)
		},
	})

	function handleHideQuestion(questionId: number) {
		executeHideQuestion({ clubQuestionId: questionId, clubId: club.id })
	}

	return (
		<li
			className="flex gap-x-4 py-2 hover:bg-slate-50 px-2 -mx-2 data-[disabled=true]:opacity-50"
			data-disabled={isTransitioning}
		>
			<p className="text-xs font-semibold text-slate-600 border border-slate-200 min-w-[22px] h-[22px] rounded-sm flex items-center justify-center">
				<span>{index + 1}</span>
			</p>
			<div className="flex flex-col">
				<Badge variant="outline" className="w-fit rounded-sm">
					{question.question.label}
				</Badge>
				<p className="text-sm text-slate-600 mt-1 relative left-1">
					{question.question.text}
				</p>
			</div>
			<div className="flex gap-x-2 ml-auto self-center items-center">
				<DialogConfirmationHideQuestion
					question={question}
					handlePrimaryAction={() => handleHideQuestion(question.id)}
					open={dialogOpen}
					onOpenChange={setDialogOpen}
				/>
				<SortableDragHandle
					variant="ghost"
					size="icon"
					className="size-8 shrink-0"
				>
					<GripVerticalIcon className="size-4" aria-hidden="true" />
				</SortableDragHandle>
			</div>
		</li>
	)
}

function DialogConfirmationHideQuestion({
	question,
	handlePrimaryAction,
	open,
	onOpenChange,
}: {
	question: NonNullable<GetClubWithAlbums>["questions"][number]
	handlePrimaryAction: () => void
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	function closeDialog() {
		onOpenChange(false)
	}

	return (
		<DialogConfirmation
			open={open}
			onOpenChange={onOpenChange}
			title="Hide question?"
			description={`Are you sure you want to hide the "${question.question.label}" question?`}
			primaryAction={{
				text: "Hide",
				variant: "destructive",
				onClick: handlePrimaryAction,
			}}
			secondaryAction={{
				text: "Cancel",
				onClick: closeDialog,
				variant: "ghost",
			}}
			Icon={AlertCircleIcon}
		>
			<Button variant="ghost" size="icon">
				<Trash className="size-4" />
			</Button>
		</DialogConfirmation>
	)
}
