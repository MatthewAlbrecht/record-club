import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { db } from "~/server/db";
import { clubMembers, clubs } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

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

  const clubsImAMemberOf = await getClubsForUser(userId);
  const clubIds = clubsImAMemberOf.map(({ club }) => club.id);
  const upcomingAlbums = await getUpcomingAlbums(clubIds, userId);

  return (
    <div className="flex flex-col gap-4">
      <Button className="w-[min-content]" asChild>
        <a href="/clubs/new">Create Club</a>
      </Button>
      <div>
        <h2 className="mb-2 text-xl font-semibold">My clubs</h2>
        <ul className="flex flex-row flex-wrap gap-2">
          {clubsImAMemberOf.map(({ club }) => (
            <li key={club.id}>
              <Button asChild>
                <Link href={`/clubs/${club.id}`}>
                  {club.name} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Coming up</h2>
        <ul className="flex flex-col divide-y-[1px]">
          {upcomingAlbums.map(
            ({ id, album, club, scheduledFor, userProgress }) => (
              <li key={album.id} className="flex flex-col py-2">
                <div className="flex flex-row justify-between">
                  <p className="font-semibold">{album.artist}</p>
                  {scheduledFor && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(scheduledFor), "MMM d")}
                    </p>
                  )}
                </div>
                <div className="flex flex-row items-center justify-between gap-1">
                  <p className="text-sm">{album.title}</p>
                  <Link
                    href={
                      userProgress[0]?.hasListened
                        ? `/clubs/${club.id}/albums/${id}`
                        : `/clubs/${club.id}/albums/${id}/progress`
                    }
                    className="flex flex-row items-center gap-1 text-sm text-accent-foreground"
                  >
                    {userProgress[0]?.hasListened
                      ? "Explore reviews"
                      : "Track progress"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

function SignedOutHome() {
  return <div>SignedOutHome</div>;
}

// Database query functions
async function getClubsForUser(userId: string) {
  return db
    .select()
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .where(and(eq(clubMembers.clerkUserId, userId), eq(clubs.isActive, true)));
}

/* TODO @matthewalbrecht: this query is slow and should be optimized */
async function getUpcomingAlbums(clubIds: number[], userId: string) {
  const formattedToday = format(new Date(), "yyyy-MM-dd");
  return db.query.clubAlbums.findMany({
    where: (clubAlbums, { and, gte, inArray }) =>
      and(
        inArray(clubAlbums.clubId, clubIds),
        gte(clubAlbums.scheduledFor, formattedToday),
      ),
    with: {
      album: true,
      club: {
        columns: {
          id: true,
          name: true,
        },
      },
      userProgress: {
        where: (userProgress, { eq }) => eq(userProgress.clerkUserId, userId),
      },
    },
    orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
  });
}
