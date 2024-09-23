"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "../db";
import { Routes } from "~/lib/routes";
import { redirect } from "next/navigation";

export async function getAuthenticatedUser() {
  const { userId } = auth();

  if (!userId) {
    redirect(Routes.SignIn);
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkId, userId),
  });
  if (!user) {
    redirect(Routes.SignIn);
  }
  return user;
}
