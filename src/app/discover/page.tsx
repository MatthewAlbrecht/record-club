import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CardClub } from "~/components/card-club"
import { Routes } from "~/lib/routes"
import { getPublicClubsImNotAMemberOf } from "~/server/api/queries"

export default async function DiscoverPage() {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const clubsImNotAMemberOf = await getPublicClubsImNotAMemberOf(userId)

	return clubsImNotAMemberOf.length > 0 ? (
		<div className="@container">
			<h3 className="mb-4 font-semibold text-base text-slate-900 leading-6">
				Popular clubs
			</h3>

			<div className="grid @2xl:grid-cols-3 @5xl:grid-cols-4 grid-cols-2 gap-4">
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
