import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "~/components/ui/button";
import { db } from "~/server/db";
import { clubMembers, clubs } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <div>
      <div>
        <SignedIn>
          <SignedInHome />
        </SignedIn>
        <SignedOut>
          <SignedOutHome />
        </SignedOut>
      </div>
    </div>
  );
}

async function SignedInHome() {
  const { userId } = auth().protect();

  const clubsImAMemberOf = await db
    .select()
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(and(eq(clubMembers.userId, userId), eq(clubs.isActive, true)));

  return (
    <div className="flex flex-col gap-4">
      <Button asChild>
        <a href="/clubs/new">Create Club</a>
      </Button>
      <div>
        <h2>Up this week</h2>
      </div>
      <div>
        <h2>My clubs</h2>
      </div>
      {clubsImAMemberOf.map(({ club, club_member: clubMember }) => (
        <div key={club.id}>
          <Link href={`/clubs/${club.id}`}>
            <div>
              <h3>{club.name}</h3>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

function SignedOutHome() {
  return <div>SignedOutHome</div>;
}
