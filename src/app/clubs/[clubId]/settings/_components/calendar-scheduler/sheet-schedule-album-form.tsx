import { useAction } from "next-safe-action/hooks"
import type { Dispatch, SetStateAction } from "react"
import { Form } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { TypeaheadAlbums } from "~/components/typeahead-albums"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { addAlbumToClub } from "~/server/api/clubs-actions"
import type { GetClubWithAlbums } from "~/server/api/queries"
import type { SheetScheduleAlbumState } from "./utils"

const scheduleAlbumSchema = z.object({
	scheduledFor: z.string(),
	album: z
		.object({
			id: z.number(),
			artist: z.string(),
			title: z.string(),
		})
		.passthrough(),
})

type ScheduleAlbumForm = z.infer<typeof scheduleAlbumSchema>

export function SheetBodyScheduleAlbumForm({
	club,
	setNewAlbumSheet,
	newAlbumSheet,
}: {
	club: NonNullable<GetClubWithAlbums>
	newAlbumSheet: SheetScheduleAlbumState
	setNewAlbumSheet: Dispatch<SetStateAction<SheetScheduleAlbumState>>
}) {
	const form = useZodForm({
		schema: scheduleAlbumSchema,
		defaultValues: {
			scheduledFor: newAlbumSheet.date ?? "",
			// biome-ignore lint/style/noNonNullAssertion: just some weird behavior to me with the onsubmit if this is not set
			album: newAlbumSheet.album!,
		},
	})

	const { execute } = useAction(addAlbumToClub, {
		onSuccess({ data }) {
			toast.success(
				`${data?.clubAlbum.album.artist} - ${data?.clubAlbum.album.title} added`,
			)
			setNewAlbumSheet({
				isOpen: false,
				variant: "scheduleAlbum",
				date: null,
			})
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
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-8"
				id="schedule-album-form"
			>
				<FormField
					name="scheduledFor"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Scheduled for</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					name="album"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Album</FormLabel>
							<FormControl>
								<TypeaheadAlbums
									selected={field.value}
									setSelected={field.onChange}
									onEmptyClick={handleEmptyClick}
								/>
							</FormControl>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	)

	function onSubmit(data: ScheduleAlbumForm) {
		if (!form.getValues("album") && !newAlbumSheet.album) {
			toast.error("Please select an album")
			return
		}
		execute({
			clubId: club.id,
			albumId: newAlbumSheet.album?.id ?? data.album.id,
			scheduledFor: data.scheduledFor,
		})
	}

	function handleEmptyClick() {
		setNewAlbumSheet((prev) => ({
			...prev,
			variant: "addAlbum",
		}))
	}
}
