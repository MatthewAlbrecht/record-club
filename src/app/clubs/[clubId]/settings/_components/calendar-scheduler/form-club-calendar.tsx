"use client"

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	Modifier,
	useDraggable,
	useDroppable,
} from "@dnd-kit/core"
import { restrictToWindowEdges, snapCenterToCursor } from "@dnd-kit/modifiers"
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	PlusIcon,
	CalendarIcon,
	ArrowLeftIcon,
	MinusIcon,
	AlertTriangleIcon,
} from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { TypeaheadAlbums } from "~/components/typeahead-albums"
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
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { cn } from "~/lib/utils"
import {
	addAlbumToClub,
	removeAlbumFromClub,
	rescheduleAlbum,
} from "~/server/api/clubs-actions"
import type { GetClubWithAlbums } from "~/server/api/queries"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { createAlbum } from "~/server/api/album-actions"
import type { SelectAlbum } from "~/server/db/schema"
import { DialogConfirmation } from "~/components/ui/dialog-confirmation"

export default function FormClubCalendar({
	club,
}: {
	club: NonNullable<GetClubWithAlbums>
}) {
	const today = new Date()
	const [currentMonth, setCurrentMonth] = useState(today)
	const [selectedDate, setSelectedDate] = useState<Date>(today)
	const [clubAlbums, setClubAlbums] = useState(club.clubAlbums)
	const [activeDragId, setActiveDragId] = useState<number | null>(null)
	const [newAlbumSheet, setNewAlbumSheet] = useState<SheetScheduleAlbumState>({
		isOpen: false,
		date: null,
		variant: "scheduleAlbum",
	})
	const [removeAlbumDialog, setRemoveAlbumDialog] = useState<RemoveAlbumDialog>(
		{
			isOpen: false,
			clubAlbum: null,
		},
	)
	const { execute: executeRescheduleAlbum } = useAction(rescheduleAlbum, {
		onSuccess: () => {
			toast.success("Album rescheduled")
		},
		onError({ error }) {
			toast.error(error.serverError ?? "Unable to update club")
		},
	})

	const { execute: executeRemoveAlbum } = useAction(removeAlbumFromClub, {
		onSuccess: () => {
			toast.success("Album removed")
			setRemoveAlbumDialog({
				isOpen: false,
				clubAlbum: null,
			})
		},
		onError({ error }) {
			toast.error(error.serverError ?? "Unable to update club")
		},
	})

	useEffect(() => {
		setClubAlbums(club.clubAlbums)
	}, [club.clubAlbums])

	const dateToClubAlbm = getClubAlbumMap(clubAlbums)
	const days = getGridDays()
	const selectedDay = days.find(
		(day) => day.date === selectedDate.toISOString().split("T")[0],
	)
	const currentMonthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
	const isDragging = activeDragId !== null

	function handleRemoveAlbum() {
		console.log("handleRemoveAlbum", removeAlbumDialog.clubAlbum)
		executeRemoveAlbum({
			// biome-ignore lint/style/noNonNullAssertion: no way they can click the button if the dialog isn't open
			clubAlbumId: removeAlbumDialog.clubAlbum!.id,
			clubId: club.id,
		})
	}

	return (
		<DndContext
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<div className="lg:flex lg:h-full lg:flex-col">
				<header className="flex items-center justify-between border-b border-gray-200  py-4 lg:flex-none">
					<div className="relative flex rounded-md bg-white shadow-sm">
						<PreviousButton
							handlePreviousMonth={handlePreviousMonth}
							isDragging={isDragging}
						/>
						<button
							type="button"
							className="border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative block min-w-[143px]"
						>
							{currentMonthLabel}
						</button>
						<NextButton
							handleNextMonth={handleNextMonth}
							isDragging={isDragging}
						/>
					</div>
					<div className="flex items-center">
						<div className="ml-4 flex items-center">
							<Button
								className="bg-indigo-600 hover:bg-indigo-500"
								onClick={() =>
									setNewAlbumSheet({
										isOpen: true,
										date: null,
										variant: "scheduleAlbum",
									})
								}
							>
								Add album
							</Button>
						</div>
					</div>
				</header>
				<div className="shadow ring-1 ring-black ring-opacity-5 lg:flex lg:flex-auto lg:flex-col">
					<div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700 lg:flex-none">
						<div className="bg-white py-2">
							M<span className="sr-only sm:not-sr-only">on</span>
						</div>
						<div className="bg-white py-2">
							T<span className="sr-only sm:not-sr-only">ue</span>
						</div>
						<div className="bg-white py-2">
							W<span className="sr-only sm:not-sr-only">ed</span>
						</div>
						<div className="bg-white py-2">
							T<span className="sr-only sm:not-sr-only">hu</span>
						</div>
						<div className="bg-white py-2">
							F<span className="sr-only sm:not-sr-only">ri</span>
						</div>
						<div className="bg-white py-2">
							S<span className="sr-only sm:not-sr-only">at</span>
						</div>
						<div className="bg-white py-2">
							S<span className="sr-only sm:not-sr-only">un</span>
						</div>
					</div>
					<div className="flex bg-gray-200 text-xs leading-6 text-gray-700 lg:flex-auto">
						<div className="hidden w-full lg:grid lg:grid-cols-7 lg:gap-px">
							{days.map((day) => (
								<DayDesktop
									key={day.date}
									day={day}
									setNewAlbumSheet={setNewAlbumSheet}
									setRemoveAlbumDialog={setRemoveAlbumDialog}
								/>
							))}
						</div>
						<div className="isolate grid w-full grid-cols-7 gap-px lg:hidden">
							{days.map((day) => (
								<DayMobile
									key={day.date}
									day={day}
									setSelectedDate={setSelectedDate}
								/>
							))}
						</div>
					</div>
				</div>
				{selectedDay && selectedDay.albums.length > 0 && (
					<div className="px-4 py-10 sm:px-6 lg:hidden">
						<ol className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow ring-1 ring-black ring-opacity-5">
							{selectedDay.albums.map((album) => (
								<li
									key={album.id}
									className="group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50"
								>
									<div className="flex-auto">
										<p className="font-semibold text-gray-900">
											{album.album.title} by {album.album.artist}
										</p>
									</div>
									<div className="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400 focus:opacity-100 group-hover:opacity-100">
										Edit
										<span className="sr-only">
											, {album.album.title} by {album.album.artist}
										</span>
									</div>
								</li>
							))}
						</ol>
					</div>
				)}
			</div>
			<DragOverlay modifiers={[restrictToWindowEdges, snapCenterToCursor]}>
				{activeDragId ? (
					<DraggedOverlay
						// biome-ignore lint/style/noNonNullAssertion: activedragid must exist in albums if its being dragged
						clubAlbum={clubAlbums.find((album) => album.id === activeDragId)!}
					/>
				) : null}
			</DragOverlay>
			<SheetNewAlbum
				club={club}
				setNewAlbumSheet={setNewAlbumSheet}
				newAlbumSheet={newAlbumSheet}
			/>
			<DialogConfirmation
				Icon={AlertTriangleIcon}
				open={removeAlbumDialog.isOpen}
				onOpenChange={(open: boolean) => {
					if (!open) {
						setRemoveAlbumDialog({
							isOpen: false,
							clubAlbum: null,
						})
					}
				}}
				title="Remove album"
				description={`Are you sure you want to remove ${removeAlbumDialog.clubAlbum?.album.title} by ${removeAlbumDialog.clubAlbum?.album.artist}?`}
				primaryAction={{
					text: "Remove",
					variant: "destructive",
					onClick: handleRemoveAlbum,
				}}
				secondaryAction={{
					text: "Cancel",
					variant: "outline",
					onClick: () => {
						setRemoveAlbumDialog({
							isOpen: false,
							clubAlbum: null,
						})
					},
				}}
			/>
		</DndContext>
	)

	function handleDragStart(event: DragStartEvent) {
		const { active } = event
		setActiveDragId(Number(active.id))
	}

	function handlePreviousMonth() {
		setCurrentMonth((prev) => {
			const newDate = new Date(prev)
			newDate.setMonth(newDate.getMonth() - 1)
			return newDate
		})
	}

	function handleNextMonth() {
		setCurrentMonth((prev) => {
			const newDate = new Date(prev)
			newDate.setMonth(newDate.getMonth() + 1)
			return newDate
		})
	}

	function getClubAlbumMap(clubAlbums: Array<ClubAlbum>) {
		return clubAlbums.reduce(
			(acc, clubAlbum) => {
				if (!clubAlbum.scheduledFor) {
					return acc
				}
				acc[clubAlbum.scheduledFor] = [
					...(acc[clubAlbum.scheduledFor] || []),
					clubAlbum,
				]
				return acc
			},
			{} as Record<
				string,
				NonNullable<GetClubWithAlbums>["clubAlbums"][number][]
			>,
		)
	}

	function getGridDays() {
		const year = currentMonth.getFullYear()
		const month = currentMonth.getMonth()

		const firstDayOfMonth = new Date(year, month, 1)

		// Find the last day of the month
		const lastDayOfMonth = new Date(year, month + 1, 0)

		// Find the first Monday (could be in the previous month)
		const firstMonday = new Date(firstDayOfMonth)
		firstMonday.setDate(
			firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7),
		)

		// Find the last Sunday (could be in the next month)
		const lastSunday = new Date(lastDayOfMonth)
		lastSunday.setDate(lastSunday.getDate() + ((7 - lastSunday.getDay()) % 7))

		const days: Array<Day> = []

		// Loop from the first Monday to the last Sunday
		for (
			let day = new Date(firstMonday);
			day <= lastSunday;
			day.setDate(day.getDate() + 1)
		) {
			days.push({
				// biome-ignore lint/style/noNonNullAssertion: day always exists and there will always be a zeroth element here
				date: day.toISOString().split("T")[0]!,
				fullDate: new Date(day.toISOString()),
				isCurrentMonth: day.getMonth() === month,
				isToday:
					day.toISOString().split("T")[0] === today.toISOString().split("T")[0],
				// biome-ignore lint/style/noNonNullAssertion: We know that the date is not null because we checked it above
				albums: dateToClubAlbm[day.toISOString().split("T")[0]!] || [],
				isSelected:
					day.toISOString().split("T")[0] ===
					selectedDate.toISOString().split("T")[0],
			})
		}

		return days
	}

	function handleDragEnd(event: DragEndEvent) {
		const { over, active } = event

		if (over) {
			const date = over.id
			const clubAlbumId = active.id

			executeRescheduleAlbum({
				clubAlbumId: Number(clubAlbumId),
				scheduledFor: String(date),
			})

			setClubAlbums((prev) =>
				prev.map((clubAlbum) => {
					if (clubAlbum.id === clubAlbumId) {
						return {
							...clubAlbum,
							scheduledFor: String(date),
						}
					}
					return clubAlbum
				}),
			)
		}
		setActiveDragId(null)
	}

	function handleDragCancel() {
		setActiveDragId(null)
	}
}

function DraggedOverlay({ clubAlbum }: { clubAlbum: ClubAlbum }) {
	return (
		<div className="bg-white flex items-center cursor-grabbing p-2 pr-6 rounded-md shadow-2xl w-fit">
			<div className="bg-gray-100 rounded-md size-12 shrink-0" />
			<div className="flex flex-col ml-2">
				<p className="font-semibold text-nowrap">{clubAlbum.album.title}</p>
				<p className="text-gray-500 text-sm text-nowrap">
					{clubAlbum.album.artist}
				</p>
			</div>
		</div>
	)
}

function PreviousButton({
	handlePreviousMonth,
	isDragging,
}: {
	handlePreviousMonth: () => void
	isDragging: boolean
}) {
	const { isOver, setNodeRef } = useDroppable({
		id: "prevButton",
	})

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null
		if (isOver) {
			intervalId = setInterval(handlePreviousMonth, 1000)
		}
		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [isOver, handlePreviousMonth])

	return (
		<button
			type="button"
			className={cn(
				"flex h-9 items-center justify-center rounded-l-md border-y border-l border-gray-300 text-gray-400 hover:text-gray-500 focus:relative w-9 pr-0 hover:bg-gray-50",
				isDragging && "border-indigo-300 border-r",
			)}
			onClick={handlePreviousMonth}
			ref={setNodeRef}
		>
			<span className="sr-only">Previous month</span>
			<ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
		</button>
	)
}

function NextButton({
	handleNextMonth,
	isDragging,
}: {
	handleNextMonth: () => void
	isDragging: boolean
}) {
	const { isOver, setNodeRef } = useDroppable({
		id: "nextButton",
	})

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null
		if (isOver) {
			intervalId = setInterval(handleNextMonth, 1000)
		}
		return () => {
			if (intervalId) clearInterval(intervalId)
		}
	}, [isOver, handleNextMonth])

	return (
		<button
			type="button"
			className={cn(
				"flex h-9 items-center justify-center rounded-r-md border-y border-r border-gray-300 text-gray-400 hover:text-gray-500 focus:relative w-9 pl-0 md:hover:bg-gray-50",
				isDragging && "border-indigo-300 border-l ",
			)}
			onClick={handleNextMonth}
			ref={setNodeRef}
		>
			<span className="sr-only">Next month</span>
			<ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
		</button>
	)
}

type ClubAlbum = NonNullable<GetClubWithAlbums>["clubAlbums"][number]

type Day = {
	date: string
	isCurrentMonth: boolean
	isToday: boolean
	isSelected: boolean
	albums: Array<ClubAlbum>
	fullDate: Date
}

function DayDesktop({
	day,
	setNewAlbumSheet,
	setRemoveAlbumDialog,
}: {
	day: Day
	setNewAlbumSheet: Dispatch<SetStateAction<SheetScheduleAlbumState>>
	setRemoveAlbumDialog: Dispatch<SetStateAction<RemoveAlbumDialog>>
}) {
	const { isOver, setNodeRef } = useDroppable({
		id: day.date,
	})

	const thisDaysClubAlbums = day.albums[0]

	function handleScheduleAlbum() {
		setNewAlbumSheet({
			isOpen: true,
			date: day.date,
			variant: "scheduleAlbum",
		})
	}

	function handleRemoveAlbum() {
		if (!thisDaysClubAlbums) {
			return
		}
		setRemoveAlbumDialog({
			isOpen: true,
			clubAlbum: thisDaysClubAlbums,
		})
	}

	return (
		<div
			key={day.date}
			className={cn(
				day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-500",
				"relative px-3 py-2 border border-transparent min-h-20 group",
				isOver && "border-indigo-500",
			)}
			ref={setNodeRef}
		>
			<time
				dateTime={day.date}
				className={
					day.isToday
						? "flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white"
						: undefined
				}
			>
				{day.date?.split("-").pop()?.replace(/^0/, "")}
			</time>
			{day.albums.length > 0 && (
				<ol className="mt-2">
					{day.albums.map((clubAlbum) => (
						<AlbumListItem key={clubAlbum.id} clubAlbum={clubAlbum} />
					))}
				</ol>
			)}
			{thisDaysClubAlbums ? (
				<Button
					size="icon"
					className="absolute top-2 right-3 h-6 w-6 bg-red-600 hidden group-hover:flex hover:bg-red-500"
					onClick={handleRemoveAlbum}
				>
					<MinusIcon className="h-4 w-4" />
				</Button>
			) : (
				<Button
					size="icon"
					className="absolute top-2 right-3 h-6 w-6 bg-indigo-600 hidden group-hover:flex hover:bg-indigo-500"
					onClick={handleScheduleAlbum}
				>
					<PlusIcon className="h-4 w-4" />
				</Button>
			)}
		</div>
	)
}

function AlbumListItem({ clubAlbum }: { clubAlbum: ClubAlbum }) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: clubAlbum.id,
		})

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined

	return (
		<li
			key={clubAlbum.id}
			className={cn("relative z-10 cursor-grab", isDragging && "opacity-0")}
			style={style}
			{...attributes}
			{...listeners}
			ref={setNodeRef}
		>
			<div className="group flex">
				<p className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600">
					{clubAlbum.album.title} by {clubAlbum.album.artist}
				</p>
			</div>
		</li>
	)
}

function DayMobile({
	day,
	setSelectedDate,
}: {
	day: Day
	setSelectedDate: Dispatch<SetStateAction<Date>>
}) {
	function handleClick() {
		setSelectedDate(day.fullDate)
	}

	return (
		<button
			key={day.date}
			type="button"
			onClick={handleClick}
			className={cn(
				day.isCurrentMonth ? "bg-white" : "bg-gray-50",
				(day.isSelected || day.isToday) && "font-semibold",
				day.isSelected && "text-white",
				!day.isSelected && day.isToday && "text-indigo-600",
				!day.isSelected &&
					day.isCurrentMonth &&
					!day.isToday &&
					"text-gray-900",
				!day.isSelected &&
					!day.isCurrentMonth &&
					!day.isToday &&
					"text-gray-500",
				"flex h-14 flex-col px-3 py-2 hover:bg-gray-100 focus:z-10",
			)}
		>
			<time
				dateTime={day.date}
				className={cn(
					day.isSelected &&
						"flex h-6 w-6 items-center justify-center rounded-full",
					day.isSelected && day.isToday && "bg-indigo-600",
					day.isSelected && !day.isToday && "bg-gray-900",
					"ml-auto",
				)}
			>
				{day.date.split("-").pop()?.replace(/^0/, "") ?? ""}
			</time>
			<span className="sr-only">{day.albums.length} events</span>
			{day.albums.length > 0 && (
				<span className="-mx-0.5 mt-auto flex flex-wrap-reverse">
					{day.albums.map((album) => (
						<span
							key={album.id}
							className="mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400"
						/>
					))}
				</span>
			)}
		</button>
	)
}

function SheetNewAlbum({
	club,
	setNewAlbumSheet,
	newAlbumSheet,
}: {
	club: NonNullable<GetClubWithAlbums>
	newAlbumSheet: SheetScheduleAlbumState
	setNewAlbumSheet: Dispatch<SetStateAction<SheetScheduleAlbumState>>
}) {
	return (
		<Sheet open={newAlbumSheet.isOpen} onOpenChange={handleOpenChange}>
			<MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
				<AnimatePresence mode="popLayout" initial={false}>
					<SheetContent className="overflow-hidden">
						{newAlbumSheet.variant === "scheduleAlbum" ? (
							<motion.div
								key="scheduleAlbum"
								initial={{ x: -200, opacity: 0, filter: "blur(4px)" }}
								animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
								exit={{ x: -200, opacity: 0, filter: "blur(4px)" }}
							>
								<SheetHeader>
									<SheetTitle>Schedule album</SheetTitle>
									<SheetDescription>
										Schedule a new album for the record club.
									</SheetDescription>
								</SheetHeader>
								<div className="py-6 flex-1">
									<SheetScheduleAlbumForm
										club={club}
										setNewAlbumSheet={setNewAlbumSheet}
										newAlbumSheet={newAlbumSheet}
									/>
								</div>
								<SheetFooter>
									<SheetClose asChild>
										<Button type="button" variant="secondary">
											Cancel
										</Button>
									</SheetClose>
									<Button type="submit" form="schedule-album-form">
										Add
									</Button>
								</SheetFooter>
							</motion.div>
						) : (
							<motion.div
								key="addAlbum"
								initial={{ x: 200, opacity: 0, filter: "blur(4px)" }}
								animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
								exit={{ x: 200, opacity: 0, filter: "blur(4px)" }}
							>
								<SheetHeader>
									<SheetTitle>Create new album</SheetTitle>
									<SheetDescription>
										Create a new album to add to your club.
									</SheetDescription>
								</SheetHeader>
								<div className="py-6">
									<SheetAddAlbumForm setNewAlbumSheet={setNewAlbumSheet} />
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
										form="add-album-form"
									>
										Submit
									</Button>
								</SheetFooter>
							</motion.div>
						)}
					</SheetContent>
				</AnimatePresence>
			</MotionConfig>
		</Sheet>
	)

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setNewAlbumSheet({
				isOpen: false,
				date: null,
				variant: "scheduleAlbum",
			})
		} else {
			setNewAlbumSheet({
				isOpen: true,
				date: newAlbumSheet.date,
				variant: newAlbumSheet.variant,
				album: newAlbumSheet.album,
			})
		}
	}
}

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

function SheetScheduleAlbumForm({
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

	function handleEmptyClick() {
		setNewAlbumSheet((prev) => ({
			...prev,
			variant: "addAlbum",
		}))
	}
}

const addAlbumSchema = z.object({
	title: z.string(),
	artist: z.string(),
	releaseDate: z.string(),
})

type AddAlbumForm = z.infer<typeof addAlbumSchema>

function SheetAddAlbumForm({
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

export const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
]

type SheetScheduleAlbumState = {
	album?: Pick<SelectAlbum, "id" | "title" | "artist">
	date: string | null
	variant: "scheduleAlbum" | "addAlbum"
	isOpen: boolean
}

type RemoveAlbumDialog =
	| {
			isOpen: true
			clubAlbum: ClubAlbum
	  }
	| {
			isOpen: false
			clubAlbum: undefined | null
	  }
