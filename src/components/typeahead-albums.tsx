import { type UseQueryOptions, useQuery } from "@tanstack/react-query"
import { CalendarIcon, Check, Loader2, PlusIcon, Search } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "~/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover"
import { useDebouncedState } from "~/lib/hooks/useDebouncedState"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { cn } from "~/lib/utils"
import { createAlbum, getAlbumBySpotifyURI } from "~/server/api/album-actions"
import type { SelectAlbum } from "~/server/db/schema"

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./ui/sheet"
import { AnimatePresence, motion } from "framer-motion"

export function TypeaheadAlbums({
	selected,
	setSelected,
	onEmptyClick,
}: {
	selected?: Pick<SelectAlbum, "id" | "title" | "artist">
	setSelected: (album: SelectAlbum) => void
	onEmptyClick?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [value, setValue] = useState("")
	const [search, setSearch] = useDebouncedState("", 300)

	const { data } = useAlbumsQuery({ search })

	const { execute, isPending } = useAction(getAlbumBySpotifyURI, {
		onSuccess: ({ data }) => {
			if (!data) return
			console.log("Album ->", data)
			setSelected(data.album)
			setOpen(false)
		},
		onError: ({ error }) => {
			if (typeof error.serverError === "string") {
				toast.error(error.serverError)
			} else {
				toast.error("Error adding album")
			}
		},
	})

	function handleInputChange(value: string) {
		if (SpotifyAlbumURIRegex.test(value)) {
			console.log("Spotify URI ->", value)
			const match = value.match(/album\/([^?]+)/)
			if (match?.[1]) {
				const albumId = match[1]
				console.log("Album ID ->", albumId)
				setValue(albumId)
				execute({ spotifyURI: albumId })
				return
			}
		}
		setValue(value)
		setSearch(value)
	}

	function handleAlbumAdd(album: SelectAlbum) {
		setSearch(album.title)
		setValue(album.title)
		setSelected(album)
	}

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{selected ? selected.title : "Search or Spotify link..."}
					<Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0 relative overflow-hidden">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search or Spotify link..."
						value={value}
						onValueChange={handleInputChange}
					/>
					<CommandList key={JSON.stringify(data)}>
						{onEmptyClick ? (
							<CommandEmpty>
								<button
									type="button"
									className="flex w-full cursor-pointer items-center justify-center p-6"
									onClick={onEmptyClick}
								>
									<PlusIcon className="mr-2 h-4 w-4" />
									Create new album
								</button>
							</CommandEmpty>
						) : (
							<EmptyCommandList onAlbumAdd={handleAlbumAdd} />
						)}
						{data?.albums && data.albums.length > 0 && (
							<CommandGroup>
								{data?.albums.map((album) => (
									<CommandItem
										key={album.id}
										value={album.id.toString()}
										onSelect={(currentValue) => {
											setSelected(album)
											setValue(currentValue === value ? "" : album.title)
											setOpen(false)
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === album.title ? "opacity-100" : "opacity-0",
											)}
										/>
										<div className="flex flex-col">
											<span className="font-semibold">{album.artist}</span>
											<span className="text-muted-foreground">
												{album.title}
											</span>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
				<AnimatePresence>
					{isPending && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2, type: "spring", bounce: 0 }}
							className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm text-slate-100"
						>
							<svg
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								className="w-12 h-12"
							>
								<title>Spotify Logo</title>
								<path
									d="M12 0C5.4 0 0 5.4 0 12C0 18.6 5.4 24 12 24C18.6 24 24 18.6 24 12C24 5.4 18.66 0 12 0ZM17.521 17.34C17.281 17.699 16.861 17.82 16.5 17.58C13.68 15.84 10.14 15.479 5.939 16.439C5.521 16.561 5.16 16.26 5.04 15.9C4.92 15.479 5.22 15.12 5.58 15C10.14 13.979 14.1 14.4 17.22 16.32C17.64 16.5 17.699 16.979 17.521 17.34ZM18.961 14.04C18.66 14.46 18.12 14.64 17.699 14.34C14.46 12.36 9.54 11.76 5.76 12.96C5.281 13.08 4.74 12.84 4.62 12.36C4.5 11.88 4.74 11.339 5.22 11.219C9.6 9.9 15 10.561 18.72 12.84C19.081 13.021 19.26 13.62 18.961 14.04ZM19.081 10.68C15.24 8.4 8.82 8.16 5.16 9.301C4.56 9.48 3.96 9.12 3.78 8.58C3.6 7.979 3.96 7.38 4.5 7.199C8.76 5.939 15.78 6.179 20.221 8.82C20.76 9.12 20.94 9.84 20.64 10.38C20.341 10.801 19.62 10.979 19.081 10.68Z"
									fill="#1DB954"
								/>
							</svg>

							<div className="flex items-center justify-center mt-6">
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Searching Spotify...
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</PopoverContent>
		</Popover>
	)
}

const createAlbumSchema = z.object({
	title: z.string().min(1),
	artist: z.string().min(1),
	releaseDate: z.string().optional(),
})

type CreateAlbumForm = z.infer<typeof createAlbumSchema>

function EmptyCommandList({
	onAlbumAdd,
}: {
	onAlbumAdd?: (album: SelectAlbum) => void
}) {
	const [open, setOpen] = useState(false)

	const form = useZodForm<CreateAlbumForm>({
		schema: createAlbumSchema,
		defaultValues: {
			title: "",
			artist: "",
		},
	})

	const { execute } = useAction(createAlbum, {
		onSuccess: ({ data }) => {
			if (!data) return
			toast.success(`${data.album.title} added`)
			setOpen(false)
			onAlbumAdd?.(data.album)
		},
		onError: ({ error }) => {
			if (typeof error.serverError === "string") {
				toast.error(error.serverError)
			} else {
				toast.error("Error adding album")
			}
		},
	})

	function onSubmit(data: CreateAlbumForm) {
		execute({
			title: data.title,
			artist: data.artist,
			releaseDate: data.releaseDate,
		})
	}

	return (
		<CommandEmpty className="p-0">
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>
					<div className="flex w-full cursor-pointer items-center justify-center p-6">
						<PlusIcon className="mr-2 h-4 w-4" />
						Create new album
					</div>
				</SheetTrigger>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Create new album</SheetTitle>
						<SheetDescription>
							Create a new album to add to your club.
						</SheetDescription>
					</SheetHeader>
					<div className="py-6">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
								id="create-album-form"
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
							form="create-album-form"
						>
							Submit
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</CommandEmpty>
	)
}

type AlbumsQueryVariables = {
	search?: string
}

function useAlbumsQuery(
	{ search }: AlbumsQueryVariables,
	options?: Omit<
		UseQueryOptions<{ albums: SelectAlbum[] }>,
		"queryKey" | "queryFn"
	>,
) {
	return useQuery({
		queryKey: ["albums", search],
		queryFn: () => {
			return fetch(`/api/albums?search=${search}`).then((res) => res.json())
		},
		...options,
	})
}

const SpotifyAlbumURIRegex =
	/^(https?:\/\/)?(open\.spotify\.com\/album\/|spotify:album:)/

const SpotifyGeneralURIRegex = /^(https?:\/\/)?open\.spotify\.com\/|spotify:/
