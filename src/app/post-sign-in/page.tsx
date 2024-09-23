import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export default async function PostSignInPage() {
  const { userId } = auth();

  console.log("===HERE===", "userId", userId);

  if (!userId) {
    return redirect("/");
  }
  console.log("===HERE=== 2222");

  const user = await clerkClient.users.getUser(userId);
  const userData = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkId, userId),
  });

  console.log("===HERE=== 3333", userData);

  await db
    .insert(users)
    .values({
      clerkId: userId,
      email: user.emailAddresses[0]!.emailAddress,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.imageUrl,
    })

    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        email: user.emailAddresses[0]!.emailAddress,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.imageUrl,
      },
    });

  return redirect("/");
}
