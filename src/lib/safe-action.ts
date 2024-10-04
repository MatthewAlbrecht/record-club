import { auth } from "@clerk/nextjs/server"
import { Ratelimit } from "@upstash/ratelimit"
import {
	DEFAULT_SERVER_ERROR_MESSAGE,
	createSafeActionClient,
} from "next-safe-action"
import { cookies } from "next/headers"
import { z } from "zod"
import { env } from "~/env"
import { ActionError, DatabaseError } from "~/server/api/utils"
import { redis } from "~/server/db/redis"

const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(10, "10 s"),
	prefix: "@record-clubs/authenticated-actions",
	// analytics: true,
})

export const actionClient = createSafeActionClient({
	handleServerError(e) {
		if (e instanceof ActionError) {
			console.error("Action error:", e.message)
			return e.message
		}

		if (e instanceof DatabaseError) {
			console.error("Database error:", e.message)
			return e.message
		}

		return DEFAULT_SERVER_ERROR_MESSAGE
	},
	defaultValidationErrorsShape: "flattened",
	defineMetadataSchema() {
		return z.object({
			actionName: z.string(),
		})
	},
}).use(async ({ next, clientInput, metadata }) => {
	console.log("\nLOGGING MIDDLEWARE")

	const startTime = performance.now()

	const result = await next()

	const endTime = performance.now()

	console.log("Result ->", result)
	console.log("Client input ->", clientInput)
	console.log("Metadata ->", metadata)
	console.log("Action execution took", endTime - startTime, "ms \n\n")

	return result
})

export const authActionClient = actionClient
	.use(async ({ next }) => {
		const { sessionId, userId } = auth()

		if (!sessionId) {
			throw new Error("Session not found!")
		}
		if (!userId) {
			throw new Error("User not found!")
		}

		return next({ ctx: { userId } })
	})
	// Rate limiting middleware: https://github.com/upstash/ratelimit-js/tree/main/examples/nextjs
	.use(async ({ next, ctx }) => {
		const identifier = ctx.userId
		const { success } = await ratelimit.limit(identifier)

		if (!success) {
			throw new Error("Rate limit exceeded")
		}

		return next()
	})

export const authAndSpotifyActionClient = authActionClient.use(
	async ({ next }) => {
		console.log("AUTH AND SPOTIFY ACTION CLIENT")
		const { userId } = auth()
		const cookieStore = cookies()

		const spotifyTokenResponse = cookieStore.get("spotify-token-response")

		if (spotifyTokenResponse) {
			try {
				const tokenData = JSON.parse(spotifyTokenResponse.value)
				const spotifyAccessToken = tokenData.access_token
				console.log("ALREADY HAVE TOKEN ->", spotifyAccessToken)
				return next({
					ctx: { userId, spotifyAccessToken },
				})
			} catch (e) {
				cookieStore.delete("spotify-token-response")
			}
		}

		const tokenResponse = await fetch(
			"https://accounts.spotify.com/api/token",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${Buffer.from(
						`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
					).toString("base64")}`,
				},
				body: "grant_type=client_credentials",
			},
		)

		const token = await tokenResponse.json()

		cookieStore.set("spotify-token-response", JSON.stringify(token), {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: token.expires_in,
			path: "/",
		})

		return next({ ctx: { userId, spotifyAccessToken: token.access_token } })
	},
)
