"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { PlusCircleIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"

import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header"
import { addQuestionToClub } from "~/server/api/clubs-actions"
import type { GetAllQuestions, GetClubMembers } from "~/server/api/queries"

export const columns: ColumnDef<NonNullable<GetAllQuestions>[number]>[] = [
	{
		id: "label",
		accessorKey: "label",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Label" />
		},
		cell: ({ row }) => {
			const question = row.original
			return (
				<Badge variant="outline" className="w-fit rounded-sm">
					{question.label}
				</Badge>
			)
		},
	},
	{
		id: "text",
		accessorKey: "text",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Text" />
		},
	},
	{
		id: "actions",
		header: "",
		accessorKey: "actions",
		meta: {
			tableHeadClassName: "w-16",
		},
		cell: ({ row, table }) => {
			const clubId = table.options.meta?.clubId

			if (clubId == null) {
				throw new Error("Club ID is not set in data table")
			}

			clubId

			const { execute } = useAction(addQuestionToClub, {
				onSuccess: ({ data }) => {
					toast.success("Question added to club")
				},
				onError: ({ error }) => {
					if (typeof error.serverError === "string") {
						toast.error(error.serverError)
					} else {
						toast.error("Unable to add question to club")
					}
				},
			})

			const question = row.original

			function handleAddToClub() {
				execute({
					// biome-ignore lint/style/noNonNullAssertion: we throw if clubId is undefined
					clubId: clubId!,
					questionId: question.id,
				})
			}

			return (
				<>
					<Button variant="ghost" size="sm" onClick={handleAddToClub}>
						<PlusCircleIcon className="size-4 mr-2" />
						Add to club
					</Button>
				</>
			)
		},
	},
] satisfies ColumnDef<NonNullable<GetAllQuestions>[number]>[]
