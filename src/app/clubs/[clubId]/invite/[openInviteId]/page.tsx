import { auth } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { Routes } from "~/lib/routes"
import { acceptClubOpenInvite } from "~/server/api/mutations"
import {
	getClubMembership,
	getClubOpenInviteByPublicId,
	getCurrentUser,
} from "~/server/api/queries"

export default async function ClubOpenInvitePage({
	params,
}: {
	params: { openInviteId: string; clubId: string }
}) {
	const { userId } = auth().protect()
	const { openInviteId, clubId } = params

	const user = await getCurrentUser(userId)

	// confirm user is is signed in & exists - this should only be hit if it's a brand new user
	if (!user) {
		return redirect(
			`${Routes.PostSignIn}?redirectUrl=${Routes.ClubOpenInvite({ clubId, openInviteId })}`,
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

	const invite = await getClubOpenInviteByPublicId(openInviteId)

	// confirm invite exists and is for the current user
	if (!invite) {
		return notFound()
	}

	if (invite.revokedAt) {
		return redirect(`${Routes.Home}?inviteRevoked=true`)
	}

	// accept the invite
	await acceptClubOpenInvite({ userId, clubId: Number(clubId) })

	return redirect(`${Routes.Club(clubId)}?inviteSuccess=true`)
}
