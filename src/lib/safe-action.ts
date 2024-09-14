import { auth } from "@clerk/nextjs/server";
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { z } from "zod";

export class ActionError extends Error {}

export const PGErrorCodes = {
  UniqueConstraintViolation: "23505",
} as const;

export class DatabaseError extends Error {
  constructor(
    public errorMap: Partial<
      Record<(typeof PGErrorCodes)[keyof typeof PGErrorCodes], string>
    >,
    options?: ErrorOptions,
  ) {
    const pgErrorCode =
      options?.cause instanceof Error ? (options.cause as any).code : undefined;

    const message =
      pgErrorCode && pgErrorCode in errorMap
        ? errorMap[pgErrorCode as keyof typeof errorMap]
        : "An unknown database error occurred";

    super(message, options);
    this.name = "DatabaseError";
  }
}

export const actionClient = createSafeActionClient({
  throwValidationErrors: true,
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof ActionError) {
      return e.message;
    }

    if (e instanceof DatabaseError) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
}).use(async ({ next, clientInput, metadata }) => {
  console.log("\nLOGGING MIDDLEWARE");

  const startTime = performance.now();

  const result = await next();

  const endTime = performance.now();

  console.log("Result ->", result);
  console.log("Client input ->", clientInput);
  console.log("Metadata ->", metadata);
  console.log("Action execution took", endTime - startTime, "ms \n\n");

  return result;
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const { sessionId, userId } = auth();

  if (!sessionId) {
    throw new Error("Session not found!");
  }
  if (!userId) {
    throw new Error("Session is not valid!");
  }

  return next({ ctx: { userId } });
});
