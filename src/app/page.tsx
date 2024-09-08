import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { db } from "~/server/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await db.query.posts.findMany();

  console.log(data);

  return (
    <div>
      <h1>Record Club</h1>
      <div>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
}
