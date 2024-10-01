import { tasks } from "@trigger.dev/sdk/v3"
import { logAction } from "~/trigger/example"

export const Action = {
	CreateClub: "create-club",
	JoinClub: "join-club",
	SubmitAlbumListen: "submit-album-listen",
} as const

type ActionType = (typeof Action)[keyof typeof Action]

// Create a discriminated union type
type ActionPayloads = {
	[Action.CreateClub]: { userId: string; clubId: number }
	[Action.JoinClub]: { userId: string; clubId: number }
	[Action.SubmitAlbumListen]: { userId: string; albumId: number }
}

async function LogAction<T extends ActionType>(
	action: T,
	payload: ActionPayloads[T],
): Promise<void> {
	try {
		await tasks.trigger<typeof logAction>("log-action", {
			action,
			...payload,
		})
	} catch (error) {
		console.error(error)
	}
}

export { LogAction }
