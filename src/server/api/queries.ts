"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Routes } from "~/lib/routes"
import { db } from "../db"

export async function getAuthenticatedUser() {
	const { userId } = auth()

	if (!userId) {
		redirect(Routes.SignIn)
	}

	const user = await db.query.users.findFirst({
		where: (users, { eq }) => eq(users.clerkId, userId),
	})
	if (!user) {
		redirect(Routes.SignIn)
	}
	return user
}
