import { useDraggable, useDroppable } from "@dnd-kit/core"
import { MinusIcon, PlusIcon } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import type {
	ClubAlbum,
	Day,
	RemoveAlbumDialog,
	SheetScheduleAlbumState,
} from "./utils"

export function CalendarDayDesktop({
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

	return (
		<div
			key={day.date}
			className={cn(
				day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-500",
				"group relative min-h-20 border border-transparent px-3 py-2",
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
					className="absolute top-2 right-3 hidden h-6 w-6 bg-red-600 hover:bg-red-500 group-hover:flex"
					onClick={handleRemoveAlbum}
				>
					<MinusIcon className="h-4 w-4" />
				</Button>
			) : (
				<Button
					size="icon"
					className="absolute top-2 right-3 hidden h-6 w-6 bg-indigo-600 hover:bg-indigo-500 group-hover:flex"
					onClick={handleScheduleAlbum}
				>
					<PlusIcon className="h-4 w-4" />
				</Button>
			)}
		</div>
	)

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
					{clubAlbum.album.name} by {clubAlbum.album.artistNames}
				</p>
			</div>
		</li>
	)
}
