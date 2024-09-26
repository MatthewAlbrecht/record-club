import { auth } from "@clerk/nextjs/server"
import { Ratelimit } from "@upstash/ratelimit"
import {
	DEFAULT_SERVER_ERROR_MESSAGE,
	createSafeActionClient,
} from "next-safe-action"
import { z } from "zod"
import { ActionError, DatabaseError } from "~/server/api/utils"
import { db, redis } from "~/server/db"

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
