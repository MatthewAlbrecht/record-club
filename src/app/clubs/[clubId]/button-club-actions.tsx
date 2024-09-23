"use client"

import { UserMinus, UserPlus } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { joinClubAction, leaveClubAction } from "~/server/api/clubs-actions"

export default function ButtonLeaveClub({
	clubId,
	className,
}: {
	clubId: number
	className?: string
}) {
	const { execute } = useAction(leaveClubAction, {
		onSuccess: ({ data }) => {
			toast.success(`You have left ${data?.club.name}`)
		},
		onError: ({ error }) => {
			if (error.serverError) {
				toast.error(error.serverError)
			} else {
				toast.error("Unable to leave club")
			}
		},
	})

	function handleLeaveClub() {
		execute({ clubId })
	}

	return (
		<Button onClick={handleLeaveClub} variant="outline" className={className}>
			<UserMinus className="mr-2 h-4 w-4" />
			Leave Club
		</Button>
	)
}

export function ButtonJoinClub({
	clubId,
	className,
}: {
	clubId: number
	className?: string
}) {
	const { execute } = useAction(joinClubAction, {
		onSuccess: ({ data }) => {
			toast.success(`You have joined ${data?.club.name}`)
		},
		onError: ({ error }) => {
			if (error.serverError) {
				toast.error(error.serverError)
			} else {
				toast.error("Unable to join club")
			}
		},
	})
	function handleJoinClub() {
		execute({ clubId })
	}

	return (
		<Button onClick={handleJoinClub} variant="outline" className={className}>
			<UserPlus className="mr-2 h-4 w-4" />
			Join club
		</Button>
	)
}
