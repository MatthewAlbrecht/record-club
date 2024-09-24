import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CardClub } from "~/components/card-club"
import { Routes } from "~/lib/routes"
import { db } from "~/server/db"
import { clubMembers } from "~/server/db/schema"

export default async function DiscoverPage() {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const clubsImNotAMemberOf = await getClubsImNotAMemberOf(userId)

	return clubsImNotAMemberOf.length > 0 ? (
		<div className="@container">
			<h3 className="mb-4 text-base font-semibold leading-6 text-slate-900">
				Popular clubs
			</h3>

			<div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
				{clubsImNotAMemberOf.map((club) => (
					<Link key={club.id} href={Routes.Club(club.id)}>
						<CardClub key={club.id} club={club} />
					</Link>
				))}
			</div>
		</div>
	) : (
		<div className="flex items-center justify-center pt-16">
			<p className="text-center text-lg text-slate-500">
				No clubs to show, sorry!
			</p>
		</div>
	)
}

function getClubsImNotAMemberOf(userId: string) {
	return db.query.clubs.findMany({
		where: (clubs, { not, inArray, eq }) =>
			not(
				inArray(
					clubs.id,
					db
						.select({ id: clubMembers.clubId })
						.from(clubMembers)
						.where(eq(clubMembers.userId, userId)),
				),
			),
		with: {
			image: true,
		},
	})
}
