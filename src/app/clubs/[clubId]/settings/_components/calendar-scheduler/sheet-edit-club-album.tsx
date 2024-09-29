import { CalendarIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import type { Dispatch, SetStateAction } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "~/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { rescheduleAlbum } from "~/server/api/clubs-actions"
import type { EditAlbumState } from "./utils"

export function SheetEditClubAlbum({
	editAlbumState,
	setEditAlbumState,
}: {
	editAlbumState: EditAlbumState
	setEditAlbumState: Dispatch<SetStateAction<EditAlbumState>>
}) {
	return (
		<Sheet
			open={editAlbumState.isOpen}
			onOpenChange={(isOpen) =>
				!isOpen && setEditAlbumState({ isOpen: false, clubAlbum: null })
			}
		>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Reschedule Album</SheetTitle>
					<SheetDescription>
						Make changes to your album here. Click save when you're done.
					</SheetDescription>
				</SheetHeader>
				<div className="py-6">
					{editAlbumState.clubAlbum && (
						<SheetBodyEditClubAlbum
							editAlbumState={editAlbumState}
							setEditAlbumState={setEditAlbumState}
						/>
					)}
				</div>
				<SheetFooter className="flex flex-row justify-end gap-2">
					<SheetClose asChild>
						<Button variant="outline" className="w-[min-content]">
							Cancel
						</Button>
					</SheetClose>
					<Button
						className="w-[min-content]"
						type="submit"
						form="reschedule-album-form"
					>
						Save
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}

const schema = z.object({
	scheduledFor: z.string(),
})

function SheetBodyEditClubAlbum({
	editAlbumState,
	setEditAlbumState,
}: {
	editAlbumState: EditAlbumState
	setEditAlbumState: Dispatch<SetStateAction<EditAlbumState>>
}) {
	const form = useZodForm({
		schema,
		defaultValues: {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			scheduledFor: editAlbumState.clubAlbum!.scheduledFor,
		},
	})

	const { execute } = useAction(rescheduleAlbum, {
		onSuccess() {
			toast.success(`${editAlbumState.clubAlbum?.album.name} rescheduled`)
			setEditAlbumState({ isOpen: false, clubAlbum: null })
		},
		onError({ error }) {
			if (typeof error.serverError === "string") {
				toast.error(error.serverError)
			} else {
				toast.error("Unable to add album to club")
			}
		},
	})

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} id="reschedule-album-form">
				<FormField
					name="scheduledFor"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Schedule for</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										type="date"
										className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-3 [&::-webkit-calendar-picker-indicator]:opacity-0"
										{...field}
										value={field.value ?? ""}
										onChange={(e) => field.onChange(e.target.value ?? "")}
									/>
									<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
										<CalendarIcon className="h-5 w-5 text-foreground" />
									</span>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	)

	function onSubmit(data: z.infer<typeof schema>) {
		execute({
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			clubAlbumId: editAlbumState.clubAlbum!.id,
			scheduledFor: data.scheduledFor,
		})
	}
}
