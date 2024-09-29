import { MoreHorizontal } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "~/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { cn } from "~/lib/utils"
import type { ClubAlbum, Day, EditAlbumState, RemoveAlbumDialog } from "./utils"

export function CalendarDayMobile({
	day,
	setSelectedDate,
}: {
	day: Day
	setSelectedDate: Dispatch<SetStateAction<Date>>
}) {
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

	function handleClick() {
		setSelectedDate(day.fullDate)
	}
}

export function CalendarDaySelected({
	day,
	setRemoveAlbumDialog,
	setEditAlbumState,
}: {
	day: Day
	setRemoveAlbumDialog: Dispatch<SetStateAction<RemoveAlbumDialog>>
	setEditAlbumState: Dispatch<SetStateAction<EditAlbumState>>
}) {
	return (
		<div className="mt-10 lg:hidden">
			<ol className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow ring-1 ring-black ring-opacity-5">
				{day.albums.map((album) => (
					<li
						key={album.id}
						className="group flex p-2 focus-within:bg-gray-50 hover:bg-gray-50 gap-x-2 items-center"
					>
						<div className="flex-none h-12 w-12 rounded-sm bg-gray-100" />
						<div className="flex-auto">
							<p className="font-semibold text-nowrap">{album.album.name}</p>
							<p className="text-gray-500 text-sm text-nowrap">
								{album.album.artistNames}
							</p>
						</div>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0">
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => handleEditClick(album)}
								>
									Reschedule
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer text-destructive focus:text-white focus:bg-destructive"
									onClick={() => handleRemoveClick(album)}
								>
									Remove
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</li>
				))}
			</ol>
		</div>
	)

	function handleEditClick(clubAlbum: ClubAlbum) {
		setEditAlbumState({
			isOpen: true,
			clubAlbum,
		})
	}

	function handleRemoveClick(clubAlbum: ClubAlbum) {
		setRemoveAlbumDialog({
			isOpen: true,
			clubAlbum,
		})
	}
}
