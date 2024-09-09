"use server"; // don't forget to add this!

import { z } from "zod";
import { authActionClient } from "~/lib/safe-action";
import { db } from "../db";
import { clubs } from "../db/schema";
import { revalidatePath } from "next/cache";

// This schema is used to validate input from client.
const schema = z.object({
  name: z.string().min(3).max(128),
  description: z.string().min(3).max(2048),
});

export const createClub = authActionClient
  .metadata({ actionName: "createClub" })
  .schema(schema)
  .action(async ({ parsedInput: { name, description }, ctx: { userId } }) => {
    const club = await db
      .insert(clubs)
      .values({ name, description, createdById: userId, ownedById: userId })
      .returning();
    revalidatePath("/");
    return { club: club[0]! };
  });
