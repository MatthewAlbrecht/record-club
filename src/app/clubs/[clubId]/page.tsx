import { auth } from "@clerk/nextjs/server"
import { Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CardUpcomingAlbum } from "~/components/card-upcoming-album"
import { ToastSearchParams } from "~/components/toast-search-params"
import { Button } from "~/components/ui/button"
import { Routes } from "~/lib/routes"
import { db } from "~/server/db"
import type { SelectClub } from "~/server/db/schema"
import { ButtonJoinClub } from "./button-club-actions"

export default async function RecordClubHome({
	params: { clubId },
}: {
	params: { clubId: string }
}) {
	const parsedClubId = Number(clubId)
	if (Number.isNaN(parsedClubId)) notFound()

	const club = await getClubWithAlbums(parsedClubId)
	if (!club) notFound()

	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const membership = await getUserClubMembership(club.id, userId)
	const isOwnerOrAdmin =
		club.ownedById === userId || membership?.role === "admin"
	const isMember = !!membership

	return isMember ? (
		<ClubPageIsMember club={club} isOwnerOrAdmin={isOwnerOrAdmin} />
	) : (
		<ClubPageIsNotMember club={club} />
	)
}

type Club = NonNullable<Awaited<ReturnType<typeof getClubWithAlbums>>>

async function ClubPageIsMember({
	club,
	isOwnerOrAdmin,
}: {
	club: Club
	isOwnerOrAdmin: boolean
}) {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const upcomingAlbums = await getUpcomingAlbums(club.id, userId)

	return (
		<>
			<div className="@container">
				<div className="-mx-main-inner -mt-main-inner relative">
					{club.image ? (
						<div className="relative @lg:h-96 @md:h-64 h-48 w-full">
							<Image
								src={club.image.url}
								alt={club.name}
								fill
								className="object-cover"
								style={{
									objectFit: "cover",
									objectPosition: `${club.image.focalPointX}% ${club.image.focalPointY}%`,
								}}
							/>
						</div>
					) : (
						<div className="aspect-video h-64" />
					)}
					<div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80">
						<div className="flex h-full flex-col justify-between p-main-inner">
							<div className="flex flex-row justify-end">
								{isOwnerOrAdmin && (
									<Button
										asChild
										variant="ghost"
										aria-label="Club Settings"
										className="px-2 text-slate-50"
									>
										<Link href={Routes.ClubSettings(club.id, "schedule")}>
											<Settings className="h-6 w-6" />
										</Link>
									</Button>
								)}
							</div>
							<div>
								<h1 className="font-bold text-5xl text-slate-50">
									{club.name}
								</h1>
								<p className="mt-3 max-w-prose text-muted-foreground text-slate-300 text-xl">
									{club.shortDescription}
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="mt-10">
					<div className="flex flex-col gap-6">
						<h2 className="font-medium text-slate-500 text-sm">
							Upcoming albums
						</h2>
						<ul className="grid @2xl:grid-cols-2 @5xl:grid-cols-3 grid-cols-1 @2xl:gap-4 @5xl:gap-6 gap-2 @2xl:gap-x-8 @5xl:gap-x-10 gap-x-6">
							{upcomingAlbums.length > 0 ? (
								upcomingAlbums.map((clubAlbum) => (
									<CardUpcomingAlbum key={clubAlbum.id} clubAlbum={clubAlbum} />
								))
							) : (
								<div className="flex h-full w-full flex-col items-center justify-center text-center">
									<p className="text-muted-foreground">No upcoming albums</p>
								</div>
							)}
						</ul>
					</div>
				</div>
			</div>
			<ToastSearchParams
				toastMap={{
					inviteSuccess: {
						message: "Welcome to the club!",
						variant: "success",
					},
					inviteAccepted: {
						message: "Invite accepted, welcome to the club!",
						variant: "success",
					},
				}}
			/>
		</>
	)
}

function ClubPageIsNotMember({ club }: { club: SelectClub }) {
	return (
		<div>
			<ButtonJoinClub clubId={club.id} className="ml-6" />
		</div>
	)
}

async function getClubWithAlbums(clubId: number) {
	return db.query.clubs.findFirst({
		where: (clubs, { eq }) => eq(clubs.id, clubId),
		with: {
			image: true,
			clubAlbums: {
				with: {
					album: true,
				},
			},
		},
	})
}

async function getUserClubMembership(clubId: number, userId: string) {
	return db.query.clubMembers.findFirst({
		where: (clubMembers, { eq, and, isNull }) =>
			and(
				eq(clubMembers.clubId, clubId),
				eq(clubMembers.userId, userId),
				isNull(clubMembers.inactiveAt),
				isNull(clubMembers.blockedAt),
			),
	})
}

/* TODO @matthewalbrecht: this query is slow and should be optimized */
async function getUpcomingAlbums(clubId: number, userId: string) {
	return db.query.clubAlbums.findMany({
		where: (clubAlbums, { and, eq }) => and(eq(clubAlbums.clubId, clubId)),
		with: {
			album: true,
			club: {
				columns: {
					id: true,
					name: true,
				},
			},
			userProgress: {
				columns: {
					skippedAt: true,
					userId: true,
					listenedAt: true,
				},
			},
		},
		orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
	})
}
