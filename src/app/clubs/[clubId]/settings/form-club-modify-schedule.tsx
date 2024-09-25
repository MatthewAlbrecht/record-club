"use client"

import { format, isAfter, parseISO } from "date-fns"
import { TrashIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { toast } from "sonner"
import { TypeaheadAlbums } from "~/components/typeahead-albums"
import { Calendar } from "~/components/ui/calendar"
import { addAlbumToClub, deleteClubAlbum } from "~/server/api/clubs-actions"
import type { SelectAlbum } from "~/server/db/schema"
import { Button } from "~/components/ui/button"
import type { GetClubWithAlbums } from "~/server/api/queries"

export function FormClubModifySchedule({
	club,
}: {
	club: NonNullable<GetClubWithAlbums>
}) {
	const [selectedDate, setSelectedDate] = useState<Date>()
	const [selectedAlbum, setSelectedAlbum] = useState<SelectAlbum>()

	const {
		execute: deleteAlbum,
		input: deleteInput,
		isExecuting: isDeleting,
	} = useAction(deleteClubAlbum, {
		onSuccess() {
			toast.success("Album deleted")
		},
		onError() {
			toast.error("Unable to delete album")
		},
	})

	const { execute: addAlbum, isExecuting: isAdding } = useAction(
		addAlbumToClub,
		{
			onSuccess() {
				toast.success("Album added")
			},
			onError() {
				toast.error("Unable to add album")
			},
		},
	)

	const today = new Date()

	const upcomingClubAlbums = club?.clubAlbums.filter(
		(clubAlbum) =>
			clubAlbum.scheduledFor &&
			isAfter(parseISO(clubAlbum.scheduledFor), today),
	)

	function handleAddAlbum() {
		if (!selectedAlbum || !selectedDate) {
			return
		}

		void addAlbum({
			clubId: club.id,
			albumId: selectedAlbum.id,
			scheduledFor: format(selectedDate, "yyyy-MM-dd"),
		})
	}

	return (
		<div>
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="w-auto">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={setSelectedDate}
						disabled={[
							{ before: new Date() },
							...(upcomingClubAlbums
								?.filter((clubAlbum) => clubAlbum.scheduledFor)
								// biome-ignore lint/style/noNonNullAssertion: it is filtered out right above
								.map((clubAlbum) => parseISO(clubAlbum.scheduledFor!)) ?? []),
						]}
						modifiers={{
							booked:
								upcomingClubAlbums
									?.filter((clubAlbum) => clubAlbum.scheduledFor)
									// biome-ignore lint/style/noNonNullAssertion: it is filtered out right above
									.map((clubAlbum) => parseISO(clubAlbum.scheduledFor!)) ?? [],
						}}
						modifiersClassNames={{
							booked: "bg-slate-200 text-slate-800 opacity-50",
						}}
					/>

					<div className="space-y-2">
						<TypeaheadAlbums
							selected={selectedAlbum}
							setSelected={setSelectedAlbum}
						/>
					</div>
					<div className="mt-6 flex justify-end">
						<Button
							type="submit"
							disabled={!selectedAlbum || !selectedDate}
							onClick={handleAddAlbum}
						>
							Add album
						</Button>
					</div>
				</div>
				<div className="w-full">
					{upcomingClubAlbums && upcomingClubAlbums.length > 0 ? (
						<ul className="space-y-2 divide-y-[1px] divide-slate-100">
							{upcomingClubAlbums.map((clubAlbum) => (
								<li
									key={clubAlbum.id}
									className={`flex items-start justify-between gap-3 py-2 ${isDeleting && deleteInput.clubAlbumId === clubAlbum.id ? "opacity-50" : ""}`}
								>
									<span className="relative top-1 text-sm text-slate-500">
										{clubAlbum.scheduledFor
											? format(parseISO(clubAlbum.scheduledFor), "M/d")
											: "Not scheduled"}
									</span>
									<span className="flex flex-1 flex-col text-lg">
										<span className="font-medium">
											{clubAlbum.album.artist}
										</span>
										<span className="italic text-slate-800">
											{clubAlbum.album.title}
										</span>
									</span>
									{clubAlbum.scheduledFor && (
										<button
											type="button"
											onClick={() => {
												void deleteAlbum({
													clubAlbumId: clubAlbum.id,
												})
											}}
											className="ml-2 self-center text-red-600 hover:text-red-800"
										>
											<TrashIcon className="h-5 w-5" />
										</button>
									)}
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-slate-500">No albums scheduled yet.</p>
					)}
				</div>
			</div>
		</div>
	)
}
