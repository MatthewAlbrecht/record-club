import { ArrowLeftIcon, CalendarIcon } from "lucide-react"
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
	FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { createAlbum } from "~/server/api/album-actions"
import type { SheetScheduleAlbumState } from "./utils"

const addAlbumSchema = z.object({
	title: z.string(),
	artist: z.string(),
	releaseDate: z.string(),
})

type AddAlbumForm = z.infer<typeof addAlbumSchema>

export function SheetBodyAddAlbumForm({
	setNewAlbumSheet,
}: {
	setNewAlbumSheet: Dispatch<SetStateAction<SheetScheduleAlbumState>>
}) {
	const form = useZodForm({
		schema: addAlbumSchema,
		defaultValues: {
			title: "",
			artist: "",
			releaseDate: "",
		},
	})

	const { execute } = useAction(createAlbum, {
		onSuccess: ({ data }) => {
			if (!data) return
			toast.success(`${data.album.title} added`)
			setNewAlbumSheet((prev) => ({
				...prev,
				variant: "scheduleAlbum",
				album: data.album,
			}))
		},
		onError: ({ error }) => {
			if (typeof error.serverError === "string") {
				toast.error(error.serverError)
			} else {
				toast.error("Error adding album")
			}
		},
	})

	return (
		<Form {...form}>
			<Button
				variant="link"
				className="pl-0 -mt-2 mb-4"
				type="button"
				onClick={() =>
					setNewAlbumSheet((prev) => ({
						...prev,
						variant: "scheduleAlbum",
					}))
				}
			>
				<ArrowLeftIcon className="h-4 w-4 mr-2" />
				Back to schedule album
			</Button>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-8"
				id="add-album-form"
			>
				<FormField
					name="title"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="artist"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Artist</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					name="releaseDate"
					control={form.control}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Release date</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										type="date"
										{...field}
										className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-3 [&::-webkit-calendar-picker-indicator]:opacity-0"
									/>
									<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
										<CalendarIcon className="h-5 w-5 text-foreground" />
									</span>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	)

	function onSubmit(data: AddAlbumForm) {
		execute({
			title: data.title,
			artist: data.artist,
			releaseDate: data.releaseDate,
		})
	}
}