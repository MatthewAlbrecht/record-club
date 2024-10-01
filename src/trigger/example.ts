import { logger, task } from "@trigger.dev/sdk/v3"
import { db } from "~/server/db"
import { InsertActionLog, actionLogs } from "~/server/db/schema"

type LogActionPayload = InsertActionLog

export const logAction = task({
	id: "log-action",
	retry: {
		maxAttempts: 3,
		factor: 1.8,
		minTimeoutInMs: 500,
		maxTimeoutInMs: 10_000,
		randomize: false,
	},
	run: async (payload: LogActionPayload, { ctx }) => {
		logger.log("Logging action", { payload, ctx })

		await db.insert(actionLogs).values(payload)

		return {
			message: "Action logged",
		}
	},
})

/**
 * INFO ABOUT THE RETRY CONFIG
		maxAttempts: 2
		What it does: Specifies the maximum number of retry attempts for the task.
		Why use it: You'd set this to control how many times Trigger.dev should try to execute the task if it fails. In this case, it will attempt the task once more after the initial failure.
		When to adjust: Increase for critical tasks that must succeed, or decrease for less important tasks or those with external dependencies that are unlikely to resolve quickly.
		
		factor: 1.8
		What it does: Determines the exponential backoff factor for retry delays.
		Why use it: This creates an increasing delay between retry attempts, helping to avoid overwhelming systems and allowing temporary issues to resolve.
		When to adjust: Increase for a more aggressive backoff (longer waits between retries) or decrease for more frequent retries. The value 1.8 is a common choice, balancing quick retries with reasonable backoff.
		
		minTimeoutInMs: 500
		What it does: Sets the minimum delay before the first retry attempt.
		Why use it: Ensures a minimum waiting period before retrying, useful for avoiding immediate retries that might hit the same transient issue.
		When to adjust: Lower for tasks that can be retried quickly, or increase if you know the system needs more time to recover between attempts.
		
		maxTimeoutInMs: 30_000
		What it does: Caps the maximum delay between retry attempts to 30 seconds.
		Why use it: Prevents excessively long waits between retries, ensuring that retries happen within a reasonable timeframe.
		When to adjust: Increase for tasks that interact with systems that might need longer to recover, or decrease if you need faster overall retry cycles.
		
		randomize: false
		What it does: When true, it adds a random factor to retry delays to help distribute retry attempts over time.
		Why use it: Randomization can help prevent "thundering herd" problems where many retries happen simultaneously after a system recovers.
		When to adjust: Consider setting to true if you have many tasks that might fail simultaneously and you want to spread out their retry attempts.
 */
