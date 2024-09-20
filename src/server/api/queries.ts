"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";

export async function getAuthenticatedUser() {
  const { userId } = auth().protect();
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkId, userId),
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
}
