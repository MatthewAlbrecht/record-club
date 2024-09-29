"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontal } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { revokeInvite } from "~/server/api/clubs-actions"
import type { GetClubInvites } from "~/server/api/queries"

export const columns: ColumnDef<NonNullable<GetClubInvites>[number]>[] = [
	{
		id: "email",
		accessorKey: "email",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Email address" />
		},
	},
	{
		id: "status",
		accessorKey: "status",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Status" />
		},
		cell: ({ row }) => {
			const status = row.original.status

			return (
				<Badge variant={getBadgeVariant(row.original)}>
					{(status === "sent" || status === "seen") &&
					row.original.expiresAt < new Date()
						? "Expired"
						: status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			)
		},
	},
	{
		id: "lastUpdated",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Last update" />
		},
		cell: ({ row }) => {
			const { createdAt, acceptedAt, declinedAt, revokedAt, seenAt, sentAt } =
				row.original
			const lastUpdated = [
				{ label: "Created", date: createdAt },
				{ label: "Accepted", date: acceptedAt },
				{ label: "Declined", date: declinedAt },
				{ label: "Revoked", date: revokedAt },
				{ label: "Seen", date: seenAt },
				{ label: "Sent", date: sentAt },
			]
				.filter((item) => item.date)
				.sort(
					// biome-ignore lint/style/noNonNullAssertion: filter out null dates above
					(a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime(),
				)[0]

			if (!lastUpdated) return null

			// biome-ignore lint/style/noNonNullAssertion: filter out null dates above
			const formattedDate = format(lastUpdated.date!, "h:mm a 'on' MMM d, yyyy")
			return `${lastUpdated.label} at ${formattedDate}`
		},
	},
	{
		id: "actions",
		header: "",
		accessorKey: "actions",
		meta: {
			tableHeadClassName: "w-16",
		},
		cell: ({ row }) => {
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuBody {...row.original} />
					</DropdownMenuContent>
				</DropdownMenu>
			)
		},
	},
] satisfies ColumnDef<Invite>[]

type Invite = NonNullable<GetClubInvites>[number]

function DropdownMenuBody({ id, status, expiresAt }: Invite) {
	const { execute: executeRevokeInvite } = useAction(revokeInvite, {
		onSuccess: () => {
			toast.success("Invite revoked")
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "An error occurred")
		},
	})

	const disableRevoke =
		status === "accepted" || status === "declined" || status === "revoked"

	const disableResend =
		status === "accepted" ||
		status === "declined" ||
		status === "revoked" ||
		expiresAt > new Date()

	function handleRevokeInvite() {
		executeRevokeInvite({ clubInviteId: id })
	}

	return (
		<div>
			<DropdownMenuItem
				className="cursor-pointer"
				disabled={disableRevoke}
				onClick={handleRevokeInvite}
			>
				Revoke
			</DropdownMenuItem>
			<DropdownMenuItem disabled={disableResend}>Resend</DropdownMenuItem>
		</div>
	)
}

function getBadgeVariant({
	status,
	expiresAt,
}: Invite): ComponentProps<typeof Badge>["variant"] {
	switch (status) {
		case "accepted":
			return "success"
		case "declined":
			return "orange"
		case "revoked":
			return "destructive"
		case "seen":
			return expiresAt < new Date() ? "secondary" : "default"
		case "sent":
			return expiresAt < new Date() ? "secondary" : "purple"
		case "created":
			return "outline"
	}
}
