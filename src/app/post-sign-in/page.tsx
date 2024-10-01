import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "~/server/db"
import { users } from "~/server/db/schema"

export default async function PostSignInPage({
	searchParams,
}: {
	searchParams: { redirectUrl: string }
}) {
	const { userId } = auth()

	if (!userId) {
		return redirect("/")
	}

	const user = await clerkClient.users.getUser(userId)

	await db
		.insert(users)
		.values({
			id: userId,
			email: user.emailAddresses[0]?.emailAddress ?? "",
			// biome-ignore lint/style/noNonNullAssertion: we force it on clerk
			username: user.username!,
			firstName: user.firstName,
			lastName: user.lastName,
			avatarUrl: user.imageUrl,
		})

		.onConflictDoUpdate({
			target: users.id,
			set: {
				email: user.emailAddresses[0]?.emailAddress ?? "",
				// biome-ignore lint/style/noNonNullAssertion: we force it on clerk
				username: user.username!,
				firstName: user.firstName,
				lastName: user.lastName,
				avatarUrl: user.imageUrl,
			},
		})

	return redirect(searchParams.redirectUrl ?? "/")
}
