import { auth } from "@clerk/nextjs/server";
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
  flattenValidationErrors,
  returnValidationErrors,
} from "next-safe-action";
import { z } from "zod";
import { ActionError, DatabaseError } from "~/server/api/utils";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      console.error("Action error:", e.message);
      return e.message;
    }

    if (e instanceof DatabaseError) {
      console.error("Database error:", e.message);
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defaultValidationErrorsShape: "flattened",
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
