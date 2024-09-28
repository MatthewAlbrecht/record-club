import type { GetClubWithAlbums } from "~/server/api/queries"
import type { SelectAlbum } from "~/server/db/schema"

export type ClubAlbum = NonNullable<GetClubWithAlbums>["clubAlbums"][number]

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

export type SheetScheduleAlbumState = {
	album?: Pick<SelectAlbum, "id" | "title" | "artist">
	date: string | null
	variant: "scheduleAlbum" | "addAlbum"
	isOpen: boolean
}

export type RemoveAlbumDialog =
	| {
			isOpen: true
			clubAlbum: ClubAlbum
	  }
	| {
			isOpen: false
			clubAlbum: undefined | null
	  }

export type Day = {
	date: string
	isCurrentMonth: boolean
	isToday: boolean
	isSelected: boolean
	albums: Array<ClubAlbum>
	fullDate: Date
}

export type EditAlbumState =
	| {
			isOpen: true
			clubAlbum: ClubAlbum
	  }
	| {
			isOpen: false
			clubAlbum: undefined | null
	  }
