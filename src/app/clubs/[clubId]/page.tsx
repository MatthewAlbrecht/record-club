import { Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CardUpcomingAlbum } from "~/components/card-upcoming-album"
import { Button } from "~/components/ui/button"
import { Routes } from "~/lib/routes"
import { getAuthenticatedUser } from "~/server/api/queries"
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

	const user = await getAuthenticatedUser()
	const membership = await getUserClubMembership(club.id, user.id)
	const isOwnerOrAdmin =
		club.ownedById === user.id || membership?.role === "admin"
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
	const user = await getAuthenticatedUser()
	const upcomingAlbums = await getUpcomingAlbums(club.id, user.id)

	return (
		<div className="@container">
			<div className="relative -mx-main-inner -mt-main-inner">
				{club.image ? (
					<div className="relative h-48 w-full @md:h-64 @lg:h-96">
						<Image
							src={club.image.url}
							alt={club.name}
							fill
							className="object-cover"
							style={{
								objectPosition: club.image.focalPoint ?? "center",
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
									<Link href={Routes.ClubSettings(club.id)}>
										<Settings className="h-6 w-6" />
									</Link>
								</Button>
							)}
						</div>
						<div>
							<h1 className="text-5xl font-bold text-slate-50">{club.name}</h1>
							<p className="mt-3 max-w-prose text-xl text-muted-foreground text-slate-300">
								{club.shortDescription}
							</p>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-10">
				<div className="flex flex-col gap-6">
					<h2 className="text-sm font-medium text-slate-500">
						Upcoming albums
					</h2>
					<ul className="grid grid-cols-1 gap-2 gap-x-6 @2xl:grid-cols-2 @2xl:gap-4 @2xl:gap-x-8 @5xl:grid-cols-3 @5xl:gap-6 @5xl:gap-x-10">
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

async function getUserClubMembership(clubId: number, userId: number) {
	return db.query.clubMembers.findFirst({
		where: (clubMembers, { eq, and }) =>
			and(
				eq(clubMembers.clubId, clubId),
				eq(clubMembers.userId, userId),
				eq(clubMembers.isActive, true),
			),
	})
}

/* TODO @matthewalbrecht: this query is slow and should be optimized */
async function getUpcomingAlbums(clubId: number, userId: number) {
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
				where: (userProgress, { eq }) => eq(userProgress.userId, userId),
			},
		},
		orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
	})
}

type ClubAlbum = Awaited<ReturnType<typeof getUpcomingAlbums>>[number]
