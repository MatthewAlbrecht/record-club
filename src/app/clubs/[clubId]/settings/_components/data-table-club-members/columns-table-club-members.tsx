"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { AlertCircleIcon, MoreHorizontal } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { DataTableColumnHeader } from "~/components/ui/data-table-column-header"
import { DialogConfirmation } from "~/components/ui/dialog-confirmation"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select"
import {
	blockMemberFromClub,
	changeMemberRole,
	removeMemberFromClub,
} from "~/server/api/clubs-actions"
import type { GetClubMembers } from "~/server/api/queries"

export const columns: ColumnDef<GetClubMembers[number]>[] = [
	{
		id: "user",
		accessorKey: "user.username",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="User" />
		},
		cell: ({ row }) => {
			const clubMember = row.original
			return (
				<Button variant="link" asChild className="p-0 text-indigo-500">
					<Link href={`/users/${clubMember.user.username}`}>
						@{clubMember.user.username}
					</Link>
				</Button>
			)
		},
	},
	{
		id: "status",
		accessorKey: "status",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Status" />
		},
		cell: ({ row }) => {
			const clubMember = row.original
			if (clubMember.blockedAt) {
				return <Badge variant="destructive">Blocked</Badge>
			}
			if (clubMember.inactiveAt) {
				return <Badge variant="secondary">Inactive</Badge>
			}
			return <Badge variant="success">Active</Badge>
		},
	},
	{
		id: "role",
		accessorKey: "role",
		header: ({ column }) => {
			return <DataTableColumnHeader column={column} title="Role" />
		},
		cell: ({ row }) => {
			const clubMember = row.original
			const { execute: executeChangeRole, isExecuting } = useAction(
				changeMemberRole,
				{
					onSuccess: ({ data }) => {
						toast.success(
							`${clubMember.user.username}'s is now ${
								data?.role === "admin" ? "an admin" : "a member"
							}`,
						)
					},
					onError: ({ error }) => {
						if (typeof error.serverError === "string") {
							toast.error(error.serverError)
						} else {
							toast.error("Unable to remove member")
						}
					},
				},
			)

			function handleChangeRole(role: "admin" | "member") {
				executeChangeRole({
					clubId: clubMember.clubId,
					userId: clubMember.userId,
					role,
				})
			}
			return clubMember.role === "owner" ? (
				"Owner"
			) : (
				<Select
					onValueChange={handleChangeRole}
					defaultValue={clubMember.role}
					disabled={isExecuting}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Role" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="member">Member</SelectItem>
					</SelectContent>
				</Select>
			)
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
			const [dialogType, setDialogType] = useState<"remove" | "block" | null>(
				null,
			)
			const { execute: executeRemoveMember } = useAction(removeMemberFromClub, {
				onSuccess: () => {
					toast.success("Member removed")
					setDialogType(null)
				},
				onError: ({ error }) => {
					if (typeof error.serverError === "string") {
						toast.error(error.serverError)
					} else {
						toast.error("Unable to remove member")
					}
				},
			})
			const { execute: executeBlockMember } = useAction(blockMemberFromClub, {
				onSuccess: () => {
					toast.success("Member blocked")
					setDialogType(null)
				},
				onError: ({ error }) => {
					if (typeof error.serverError === "string") {
						toast.error(error.serverError)
					} else {
						toast.error("Unable to block member")
					}
				},
			})
			const clubMember = row.original

			if (!table.options.meta?.currentMember) {
				return null
			}

			if (table.options.meta.currentMember.role !== "owner") {
				return null
			}

			if (clubMember.role === "owner") {
				return null
			}

			function handleRemoveMember() {
				executeRemoveMember({
					clubId: clubMember.clubId,
					userId: clubMember.userId,
				})
			}

			function handleBlockMember() {
				executeBlockMember({
					clubId: clubMember.clubId,
					userId: clubMember.userId,
				})
			}

			function handlePrimaryAction() {
				if (dialogType === "remove") {
					handleRemoveMember()
				}
				if (dialogType === "block") {
					handleBlockMember()
				}
			}

			function handleSecondaryAction() {
				setDialogType(null)
			}

			return (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setDialogType("remove")}
							>
								Remove member
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer text-destructive focus:text-white focus:bg-destructive"
								onClick={() => setDialogType("block")}
							>
								Block member
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<div className="cursor-not-allowed">
								<DropdownMenuItem disabled>See all posts</DropdownMenuItem>
								<DropdownMenuItem disabled>Go to profile</DropdownMenuItem>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
					<DialogConfirmationRemoveMember
						clubMember={clubMember}
						dialogType={dialogType}
						handleSecondaryAction={handleSecondaryAction}
						handlePrimaryAction={handlePrimaryAction}
					/>
				</>
			)
		},
	},
] satisfies ColumnDef<GetClubMembers[number]>[]

function DialogConfirmationRemoveMember({
	clubMember,
	dialogType,
	handleSecondaryAction,
	handlePrimaryAction,
}: {
	clubMember: GetClubMembers[number]
	dialogType: "remove" | "block" | null
	handleSecondaryAction: () => void
	handlePrimaryAction: () => void
}) {
	const open = dialogType === "remove" || dialogType === "block"

	return (
		<DialogConfirmation
			open={open}
			onOpenChange={handleSecondaryAction}
			title={`${dialogType === "remove" ? "Remove" : "Block"} @${clubMember.user.username}?`}
			description={`Are you sure you want to ${dialogType === "remove" ? "remove" : "block"} @${clubMember.user.username} from the club?`}
			primaryAction={{
				text: `${dialogType === "remove" ? "Remove" : "Block"}`,
				variant: "destructive",
				onClick: handlePrimaryAction,
			}}
			secondaryAction={{
				text: "Cancel",
				onClick: handleSecondaryAction,
				variant: "ghost",
			}}
			Icon={AlertCircleIcon}
		/>
	)
}
