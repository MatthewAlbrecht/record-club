import { Sheet } from "~/components/ui/sheet"

import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "~/components/ui/button"
import {
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet"
import type { GetClubWithAlbums } from "~/server/api/queries"
import { SheetBodyAddAlbumForm } from "./sheet-add-album-form"
import { SheetBodyScheduleAlbumForm } from "./sheet-schedule-album-form"
import type { SheetScheduleAlbumState } from "./utils"

export function SheetScheduleAlbum({
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
								<div className="flex-1 py-6">
									<SheetBodyScheduleAlbumForm
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
									<SheetBodyAddAlbumForm setNewAlbumSheet={setNewAlbumSheet} />
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
