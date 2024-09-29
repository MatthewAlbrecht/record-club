"use client"

import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	useDroppable,
} from "@dnd-kit/core"
import { restrictToWindowEdges, snapCenterToCursor } from "@dnd-kit/modifiers"
import {
	AlertTriangleIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { DialogConfirmation } from "~/components/ui/dialog-confirmation"
import { cn } from "~/lib/utils"
import {
	removeAlbumFromClub,
	rescheduleAlbum,
} from "~/server/api/clubs-actions"
import type { GetClubWithAlbums } from "~/server/api/queries"
import { CalendarDayDesktop } from "./calendar-day-desktop"
import { CalendarDayMobile, CalendarDaySelected } from "./calendar-day-mobile"
import { SheetEditClubAlbum } from "./sheet-edit-club-album"
import { SheetScheduleAlbum } from "./sheet-schedule-album"
import {
	type ClubAlbum,
	type Day,
	type EditAlbumState,
	type RemoveAlbumDialog,
	type SheetScheduleAlbumState,
	monthNames,
} from "./utils"

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
	const [editAlbumState, setEditAlbumState] = useState<EditAlbumState>({
		isOpen: false,
		clubAlbum: null,
	})
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

	return (
		<DndContext
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<div className="lg:flex lg:h-full lg:flex-col">
				<header className="flex items-center justify-between border-gray-200 border-b py-4 lg:flex-none">
					<div className="relative flex rounded-md bg-white shadow-sm">
						<PreviousButton
							handlePreviousMonth={handlePreviousMonth}
							isDragging={isDragging}
						/>
						<button
							type="button"
							className="block min-w-[143px] border-gray-300 border-y px-3.5 font-semibold text-gray-900 text-sm hover:bg-gray-50 focus:relative"
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
					<div className="grid grid-cols-7 gap-px border-gray-300 border-b bg-gray-200 text-center font-semibold text-gray-700 text-xs leading-6 lg:flex-none">
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
					<div className="flex bg-gray-200 text-gray-700 text-xs leading-6 lg:flex-auto">
						<div className="hidden w-full lg:grid lg:grid-cols-7 lg:gap-px">
							{days.map((day) => (
								<CalendarDayDesktop
									key={day.date}
									day={day}
									setNewAlbumSheet={setNewAlbumSheet}
									setRemoveAlbumDialog={setRemoveAlbumDialog}
								/>
							))}
						</div>
						<div className="isolate grid w-full grid-cols-7 gap-px lg:hidden">
							{days.map((day) => (
								<CalendarDayMobile
									key={day.date}
									day={day}
									setSelectedDate={setSelectedDate}
								/>
							))}
						</div>
					</div>
				</div>
				{selectedDay && selectedDay.albums.length > 0 && (
					<CalendarDaySelected
						day={selectedDay}
						setRemoveAlbumDialog={setRemoveAlbumDialog}
						setEditAlbumState={setEditAlbumState}
					/>
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
			<SheetScheduleAlbum
				club={club}
				setNewAlbumSheet={setNewAlbumSheet}
				newAlbumSheet={newAlbumSheet}
			/>
			<SheetEditClubAlbum
				editAlbumState={editAlbumState}
				setEditAlbumState={setEditAlbumState}
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
				description={`Are you sure you want to remove ${removeAlbumDialog.clubAlbum?.album.name} by ${removeAlbumDialog.clubAlbum?.album.artistNames}?`}
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

	function handleRemoveAlbum() {
		console.log("handleRemoveAlbum", removeAlbumDialog.clubAlbum)
		executeRemoveAlbum({
			// biome-ignore lint/style/noNonNullAssertion: no way they can click the button if the dialog isn't open
			clubAlbumId: removeAlbumDialog.clubAlbum!.id,
			clubId: club.id,
		})
	}

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

			const clubAlbum = clubAlbums.find((album) => album.id === clubAlbumId)

			if (!clubAlbum || clubAlbum.scheduledFor === date) {
				return
			}

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
		<div className="flex w-fit cursor-grabbing items-center rounded-md bg-white p-2 pr-6 shadow-2xl">
			<div className="flex size-12 items-center justify-center bg-slate-200">
				{clubAlbum.album.spotifyImageUrl && (
					<Image
						src={clubAlbum.album.spotifyImageUrl}
						alt={clubAlbum.album.name}
						width={12 * 4}
						height={12 * 4}
						className="rounded-sm"
					/>
				)}
			</div>
			<div className="ml-2 flex flex-col">
				<p className="text-nowrap font-semibold">{clubAlbum.album.name}</p>
				<p className="text-nowrap text-gray-500 text-sm">
					{clubAlbum.album.artistNames}
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
				"flex h-9 w-9 items-center justify-center rounded-l-md border-gray-300 border-y border-l pr-0 text-gray-400 hover:bg-gray-50 hover:text-gray-500 focus:relative",
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
				"flex h-9 w-9 items-center justify-center rounded-r-md border-gray-300 border-y border-r pl-0 text-gray-400 hover:text-gray-500 focus:relative md:hover:bg-gray-50",
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
