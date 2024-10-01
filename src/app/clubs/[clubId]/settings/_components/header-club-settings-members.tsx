"use client"

import { XIcon } from "lucide-react"
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
import { useZodForm } from "~/lib/hooks/useZodForm"
import { inviteMembers } from "~/server/api/clubs-actions"
import type { GetClubWithAlbums } from "~/server/api/queries"

export function HeaderClubSettingsMembers({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	return (
		<div className="mb-8 flex items-center justify-between">
			<h2 className="font-bold text-xl">Members</h2>
			{!club.isPublic ? <SheetInviteMembers club={club} /> : null}
		</div>
	)
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
