import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export default async function PostSignInPage() {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const user = await clerkClient.users.getUser(userId);
  const userData = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkId, userId),
  });

  if (!userData) {
    await db.insert(users).values({
      clerkId: userId,
      email: user.emailAddresses[0]!.emailAddress,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.imageUrl,
    });
  }

  return redirect("/");
}
