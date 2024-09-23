import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { db } from "~/server/db";
import { clubMembers, clubs, images } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "~/server/api/queries";
import { CardClub } from "~/components/card-club";
import { CardUpcomingAlbum } from "~/components/card-upcoming-album";
import { Routes } from "~/lib/routes";
import { ButtonCreateLarge } from "~/components/button-create-large";

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
  const user = await getAuthenticatedUser();

  const clubsImAMemberOf = await getClubsForUser(user!.id);
  const clubIds = clubsImAMemberOf.map(({ club }) => club.id);
  const upcomingAlbums = await getUpcomingAlbums(clubIds, user!.id);

  return (
    <div className="flex flex-col gap-10 @container">
      <Link href={Routes.NewClub} className="max-w-96">
        <ButtonCreateLarge label="Create your own club" />
      </Link>
      <div>
        <h3 className="mb-4 text-base font-semibold leading-6 text-slate-900">
          My clubs
        </h3>
        <ul className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
          {clubsImAMemberOf.map(({ club, image }) => (
            <Link key={club.id} href={Routes.Club(club.id)}>
              <CardClub key={club.id} club={{ ...club, image }} />
            </Link>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-4 text-base font-semibold leading-6 text-slate-900">
          Coming up
        </h3>
        <ul className="grid grid-cols-1 gap-2 gap-x-6 @2xl:grid-cols-2 @2xl:gap-4 @2xl:gap-x-8 @5xl:grid-cols-3 @5xl:gap-6 @5xl:gap-x-10">
          {upcomingAlbums.map((clubAlbum) => (
            <CardUpcomingAlbum key={clubAlbum.id} clubAlbum={clubAlbum} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SignedOutHome() {
  return <div>SignedOutHome</div>;
}

// Database query functions
async function getClubsForUser(userId: number) {
  return db
    .select()
    .from(clubMembers)
    .innerJoin(clubs, eq(clubMembers.clubId, clubs.id))
    .innerJoin(images, eq(clubs.imageId, images.id))
    .where(and(eq(clubMembers.userId, userId), eq(clubs.isActive, true)));
}

/* TODO @matthewalbrecht: this query is slow and should be optimized */
async function getUpcomingAlbums(clubIds: number[], userId: number) {
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
        where: (userProgress, { eq }) => eq(userProgress.userId, userId),
      },
    },
    orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
  });
}
