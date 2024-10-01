import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { Routes } from "~/lib/routes"
import { acceptClubInvite } from "~/server/api/mutations"
import {
	getClubInvite,
	getClubMembership,
	getCurrentUser,
} from "~/server/api/queries"

export default async function ClubJoinPage({
	params,
}: {
	params: { inviteId: string; clubId: string }
}) {
	const { userId } = auth().protect()
	const { inviteId, clubId } = params

	const user = await getCurrentUser(userId)

	// confirm user is is signed in & exists - this should only be hit if it's a brand new user
	if (!user) {
		return redirect(
			`${Routes.PostSignIn}?redirectUrl=${Routes.ClubJoin(clubId, inviteId)}`,
		)
	}

	const clubMembership = await getClubMembership(Number(clubId), userId)

	// confirm user is not already an active member
	if (clubMembership && !clubMembership.inactiveAt) {
		return redirect(Routes.Club(clubId))
	}

	// confirm user is not blocked
	if (clubMembership?.inactiveAt && clubMembership.blockedAt) {
		return redirect(`${Routes.Home}?inviteBlocked=true`)
	}

	const invite = await getClubInvite(inviteId)

	// confirm invite exists and is for the current user
	if (!invite || invite.email !== user.email) {
		return notFound()
	}

	// confirm invite is not expired
	if (invite.expiresAt < new Date()) {
		return redirect(`${Routes.Home}?inviteBlocked=true`)
	}

	// accept the invite
	await acceptClubInvite({ userId, clubId: Number(clubId), inviteId })

	return redirect(`${Routes.Club(clubId)}?inviteSuccess=true`)
}
