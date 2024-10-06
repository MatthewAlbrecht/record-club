import { auth } from "@clerk/nextjs/server"
import { differenceInDays, format, parseISO } from "date-fns"
import { ArrowRight, UsersIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type {
	SelectAlbum,
	SelectClub,
	SelectClubAlbum,
	SelectUserClubAlbumProgress,
} from "~/server/db/schema"
export function CardUpcomingAlbum({
	clubAlbum,
}: {
	clubAlbum: Pick<SelectClubAlbum, "id" | "scheduledFor"> & {
		userProgress: Pick<
			SelectUserClubAlbumProgress,
			"listenedAt" | "userId" | "skippedAt"
		>[]
		club: Pick<SelectClub, "id">
		album: Pick<SelectAlbum, "id" | "artistNames" | "name" | "spotifyImageUrl">
	}
}) {
	const { userId } = auth()
	const relativeDate = getRelativeDateLabel(clubAlbum.scheduledFor)
	const album = clubAlbum.album
	const userProgress = clubAlbum.userProgress.find(
		(progress) => progress.userId === userId,
	)

	const totalListened = clubAlbum.userProgress.reduce((acc, progress) => {
		if (progress.listenedAt) {
			return acc + 1
		}
		return acc
	}, 0)

	return (
		<li key={clubAlbum.id}>
			<Link
				href={
					userProgress?.listenedAt
						? `/clubs/${clubAlbum.club.id}/albums/${clubAlbum.id}`
						: `/clubs/${clubAlbum.club.id}/albums/${clubAlbum.id}/progress`
				}
				className="-mx-2 flex h-full flex-row items-center gap-2 rounded-md bg-slate-50 p-2 hover:bg-slate-100"
			>
				{album.spotifyImageUrl ? (
					<Image
						src={album.spotifyImageUrl}
						alt={album.name}
						width={96}
						height={96}
						className="rounded-sm"
					/>
				) : (
					<div className="h-24 w-24 flex-shrink-0 rounded-sm bg-gradient-to-bl from-slate-100 to-slate-200" />
				)}
				<div className="flex h-full flex-grow flex-col justify-between overflow-hidden py-2">
					<div className="min-w-0">
						<div className="flex flex-row items-center justify-between gap-2">
							<h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-lg text-slate-700">
								{clubAlbum.album.artistNames}
							</h3>
							<div className="flex flex-row items-center gap-1">
								<span className="text-slate-500 text-sm">{totalListened}</span>
								<UsersIcon className="h-3.5 w-3.5 text-slate-500" />
							</div>
						</div>
						<p className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-500 text-sm">
							{clubAlbum.album.name}
						</p>
					</div>
					<div className="flex items-center justify-between gap-2">
						<span className="text-slate-500 text-sm">{relativeDate}</span>
						<div className="flex flex-row items-center gap-1 text-slate-500 text-sm">
							{clubAlbum.userProgress[0]?.listenedAt
								? "Explore reviews"
								: "Track progress"}
							<ArrowRight className="h-4 w-4" />
						</div>
					</div>
				</div>
			</Link>
		</li>
	)
}

function getRelativeDateLabel(scheduledFor: string | null | undefined) {
	const today = new Date(
		new Date().toLocaleString("en-US", { timeZone: "UTC" }),
	)
	const scheduledDate = scheduledFor ? parseISO(scheduledFor) : null

	if (!scheduledDate) return null

	const delta = differenceInDays(scheduledDate, today)

	if (delta === 0) return "Today"
	if (delta === 1) return "Tomorrow"
	if (delta === -1) return "Yesterday"
	if (delta < -1 && delta >= -7) return `${-delta} days ago`
	if (delta > 1 && delta <= 7) return `in ${delta} days`

	return format(scheduledDate, "MMM d, yyyy")
}
