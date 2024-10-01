"use client"

import { CopyIcon, Loader, RefreshCwIcon, XIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet"
import { env } from "~/env"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { Routes } from "~/lib/routes"
import { cn } from "~/lib/utils"
import {
	createInviteLink,
	inviteMembers,
	refreshOpenInviteLink,
} from "~/server/api/clubs-actions"
import type { GetClubOpenInvite, GetClubWithAlbums } from "~/server/api/queries"

export function HeaderClubSettingsMembers({
	club,
	openInvite,
}: { club: NonNullable<GetClubWithAlbums>; openInvite: GetClubOpenInvite }) {
	return (
		<div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
			<h2 className="font-bold text-xl">Members</h2>
			<div className="flex flex-row-reverse items-center justify-end gap-2 md:flex-row md:justify-start">
				<ButtonInviteLink club={club} openInvite={openInvite} />
				{!club.isPublic ? <SheetInviteMembers club={club} /> : null}
			</div>
		</div>
	)
}

function ButtonInviteLink({
	club,
	openInvite,
}: { club: NonNullable<GetClubWithAlbums>; openInvite: GetClubOpenInvite }) {
	const [isCopying, setIsCopying] = useState(false)
	const { execute: executeCreateInviteLink } = useAction(createInviteLink, {
		onSuccess: () => {
			toast.success("Invite link created")
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Something went wrong")
		},
	})

	const { execute: executeRefreshOpenInviteLink, isPending: isRefreshing } =
		useAction(refreshOpenInviteLink, {
			onSuccess: () => {
				toast.success("Invite link refreshed")
			},
			onError: ({ error }) => {
				toast.error(error.serverError ?? "Something went wrong")
			},
		})

	function handleCopyInviteLink(invite: NonNullable<GetClubOpenInvite>) {
		setIsCopying(true)
		navigator.clipboard.writeText(
			`${env.NEXT_PUBLIC_VERCEL_URL}${Routes.ClubOpenInvite({
				clubId: club.id,
				openInviteId: invite.publicId,
			})}`,
		)
		setTimeout(() => {
			setIsCopying(false)
			toast.success("Invite link copied to clipboard")
		}, 500)
	}

	function handleRefreshInviteLink(invite: NonNullable<GetClubOpenInvite>) {
		executeRefreshOpenInviteLink({
			clubId: club.id,
			openInviteId: invite.id,
		})
	}

	if (openInvite) {
		return (
			<div className="flex gap-2">
				<Button
					size="icon"
					variant="ghost"
					onClick={() => handleRefreshInviteLink(openInvite)}
				>
					<RefreshCwIcon
						className={cn("size-4", isRefreshing && "animate-spin")}
					/>
					<span className="sr-only">Refresh</span>
				</Button>

				<Button
					className="flex items-center justify-between gap-2"
					variant="outline"
					onClick={() => handleCopyInviteLink(openInvite)}
				>
					<span className={cn(isRefreshing && "opacity-30")}>
						{isRefreshing ? "Refreshing..." : "Copy invite link"}
					</span>
					<div>
						{isCopying ? (
							<Loader className="size-4 animate-spin" />
						) : (
							<span>
								<CopyIcon className="size-4" />
								<span className="sr-only">Copy</span>
							</span>
						)}
					</div>
				</Button>
			</div>
		)
	}
	if (!openInvite) {
		return (
			<Button
				size="sm"
				variant="outline"
				onClick={() => executeCreateInviteLink({ clubId: club.id })}
			>
				Create invite link
			</Button>
		)
	}
}

const addEmailSchema = z.object({
	emailInput: z.string().email(),
})

const inviteMembersSchema = z.object({
	emails: z.array(z.string().email()).min(1),
})

function SheetInviteMembers({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	const [open, setOpen] = useState(false)

	const addEmailForm = useZodForm({
		schema: addEmailSchema,
		defaultValues: {
			emailInput: "",
		},
	})

	const inviteMembersForm = useZodForm({
		schema: inviteMembersSchema,
		defaultValues: {
			emails: [],
		},
	})

	const { execute: executeInviteMembers } = useAction(inviteMembers, {
		onSuccess: ({ data }) => {
			if (!data?.invites) return
			console.log(data)
			toast.success(
				`Sent ${data.invites.length} invite${data.invites.length > 1 ? "s" : ""}`,
			)
			setOpen(false)
			inviteMembersForm.reset()
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Something went wrong")
		},
	})

	function handleAddEmailSubmit() {
		inviteMembersForm.setValue("emails", [
			...inviteMembersForm.getValues("emails"),
			addEmailForm.getValues("emailInput"),
		])
		addEmailForm.setValue("emailInput", "")
	}

	function handleInviteSubmit(data: z.infer<typeof inviteMembersSchema>) {
		executeInviteMembers({ clubId: club.id, emails: data.emails })
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button size="sm">Invite Members</Button>
			</SheetTrigger>
			<SheetContent className="flex flex-col">
				<SheetHeader>
					<SheetTitle>Invite Members</SheetTitle>
					<SheetDescription>Invite members to your club.</SheetDescription>
				</SheetHeader>
				<div className="my-6 flex-1">
					<Form {...addEmailForm}>
						<form onSubmit={addEmailForm.handleSubmit(handleAddEmailSubmit)}>
							<FormField
								control={addEmailForm.control}
								name="emailInput"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Add email addresses</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Input {...field} />
												<Button
													size="default"
													variant="secondary"
													type="submit"
												>
													Add
												</Button>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</form>
					</Form>
					<Form {...inviteMembersForm}>
						<form
							onSubmit={inviteMembersForm.handleSubmit(handleInviteSubmit)}
							id="invite-members-form"
						>
							<ul className="mt-4 flex flex-wrap gap-2">
								{inviteMembersForm.watch("emails").map((email) => (
									<li key={email}>
										<button type="button">
											<Badge
												className="group inline-flex items-center gap-2"
												variant="outline"
												onClick={() => {
													inviteMembersForm.setValue(
														"emails",
														inviteMembersForm
															.getValues("emails")
															.filter((e) => e !== email),
													)
												}}
											>
												{email}
												<XIcon className="-mr-1 size-4 group-hover:scale-110" />
											</Badge>
										</button>
									</li>
								))}
							</ul>
						</form>
					</Form>
				</div>
				<SheetFooter>
					<Button type="submit" form="invite-members-form">
						Send invite
						{inviteMembersForm.watch("emails").length > 1 ? "s" : ""}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
