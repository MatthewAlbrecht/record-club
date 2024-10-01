import { SignedIn, SignedOut } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ButtonCreateLarge } from "~/components/button-create-large"
import { CardClub } from "~/components/card-club"
import { CardInvite } from "~/components/card-invite"
import { CardUpcomingAlbum } from "~/components/card-upcoming-album"
import { ToastSearchParams } from "~/components/toast-search-params"
import { Routes } from "~/lib/routes"
import {
	getOpenClubInvites,
	getUpcomingAlbums,
	getUserClubs,
} from "~/server/api/queries"

export const dynamic = "force-dynamic"

export default async function HomePage() {
	return (
		<div>
			<div>
				<SignedIn>
					<SignedInHome />
				</SignedIn>
				<SignedOut>
					<SignedOutHome />
				</SignedOut>
			</div>
		</div>
	)
}

async function SignedInHome() {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const clubsImAMemberOf = await getUserClubs(userId)
	const clubIds = clubsImAMemberOf.map(({ club }) => club.id)
	const upcomingAlbums = await getUpcomingAlbums(clubIds, userId)
	const invites = await getOpenClubInvites(userId)

	console.log(invites)

	return (
		<>
			<div className="@container flex flex-col gap-10">
				<Link href={Routes.NewClub} className="max-w-96">
					<ButtonCreateLarge label="Create your own club" />
				</Link>
				<div>
					<h3 className="mb-4 font-semibold text-base text-slate-900 leading-6">
						My clubs
					</h3>
					<ul className="grid @2xl:grid-cols-3 @5xl:grid-cols-4 grid-cols-2 gap-4">
						{clubsImAMemberOf.map(({ club, image }) => (
							<Link key={club.id} href={Routes.Club(club.id)}>
								<CardClub key={club.id} club={{ ...club, image }} />
							</Link>
						))}
					</ul>
				</div>
				{invites.length > 0 && (
					<div>
						<h3 className="mb-4 font-semibold text-base text-slate-900 leading-6">
							Invites
						</h3>
						<ul className="grid @2xl:grid-cols-2 @5xl:grid-cols-3 grid-cols-1 @2xl:gap-4 @5xl:gap-6 gap-2 @2xl:gap-x-8 @5xl:gap-x-10 gap-x-6">
							{invites.map((invite) => (
								<CardInvite key={invite.id} invite={invite} />
							))}
						</ul>
					</div>
				)}
				<div>
					<h3 className="mb-4 font-semibold text-base text-slate-900 leading-6">
						Coming up
					</h3>
					<ul className="grid @2xl:grid-cols-2 @5xl:grid-cols-3 grid-cols-1 @2xl:gap-4 @5xl:gap-6 gap-2 @2xl:gap-x-8 @5xl:gap-x-10 gap-x-6">
						{upcomingAlbums.map((clubAlbum) => (
							<CardUpcomingAlbum key={clubAlbum.id} clubAlbum={clubAlbum} />
						))}
					</ul>
				</div>
			</div>
			<ToastSearchParams
				toastMap={{
					inviteBlocked: {
						message: "You have been blocked from this club.",
						variant: "error",
					},
					inviteExpired: {
						message:
							"Your invite has expired, please ask the club owner to send you a new one.",
						variant: "warning",
					},
					inviteRejected: {
						message: "Invite declined",
						variant: "success",
					},
				}}
			/>
		</>
	)
}

function SignedOutHome() {
	return <div>MARKETING PAGE PROBABLY</div>
}
