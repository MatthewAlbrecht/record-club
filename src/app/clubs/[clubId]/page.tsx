import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Calendar,
  Music,
  Users,
  Share2,
  Settings,
  NotebookPen,
  Table,
  ChartColumnStacked,
  ArrowRight,
} from "lucide-react";
import { db } from "~/server/db";
import { notFound } from "next/navigation";
import { SelectAlbum, SelectClub, SelectClubAlbum } from "~/server/db/schema";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import ButtonLeaveClub, { ButtonJoinClub } from "./button-club-actions";
import { differenceInDays, format, isAfter, parseISO } from "date-fns";
import { getAuthenticatedUser } from "~/server/api/queries";

export default async function RecordClubHome({
  params: { clubId },
}: {
  params: { clubId: string };
}) {
  const parsedClubId = Number(clubId);
  if (isNaN(parsedClubId)) notFound();

  const club = await getClubWithAlbums(parsedClubId);
  if (!club) notFound();

  const user = await getAuthenticatedUser();
  const membership = await getUserClubMembership(club.id, user.id);
  const isOwner = club.ownedById === user.id;
  const isMember = !!membership;

  return isMember ? (
    <ClubPageIsMember club={club} isOwner={isOwner} />
  ) : (
    <ClubPageIsNotMember club={club} />
  );
}

type Club = NonNullable<Awaited<ReturnType<typeof getClubWithAlbums>>>;

async function ClubPageIsMember({
  club,
  isOwner,
}: {
  club: Club;
  isOwner: boolean;
}) {
  const user = await getAuthenticatedUser();
  const upcomingAlbums = await getUpcomingAlbums(club.id, user.id);

  const upcomingAlbum = upcomingAlbums.find(
    (album) =>
      album.scheduledFor && isAfter(parseISO(album.scheduledFor), new Date()),
  );

  const daysUntilUpcomingAlbum = getDaysUntilUpcomingAlbum(
    upcomingAlbum?.scheduledFor,
  );

  return (
    <div className="@container">
      <div className="relative -mx-main-inner -mt-main-inner">
        {club.image ? (
          <img
            src={club.image.url}
            alt={club.name}
            className="@lg:h-96rounded-tl-lg h-48 w-full rounded-tr-lg object-cover @md:h-64"
            style={{
              objectPosition: club.image.focalPoint ?? "center",
            }}
          />
        ) : (
          <div className="aspect-video h-64"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80">
          <div className="flex h-full flex-col justify-end p-main-inner">
            <div>
              <h1 className="text-2xl font-bold text-slate-50">{club.name}</h1>
              <p className="text-muted-foreground text-slate-300">
                {club.shortDescription}
              </p>
            </div>
            <div></div>
          </div>
        </div>
      </div>
      {/* <header className="flex items-center justify-between">
        <div> 
          <Avatar className="h-20 w-20">
            <AvatarImage src={undefined} alt={club.name} />
            <AvatarFallback>
              {club.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 3)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{club.name}</h1>
            <p className="text-muted-foreground">{club.shortDescription}</p>
          </div>
        </div>
        {isOwner && (
          <Button
            asChild
            variant="ghost"
            aria-label="Club Settings"
            className="px-2"
          >
            <Link href={`/clubs/${club.id}/settings`}>
              <Settings className="h-6 w-6" />
            </Link>
          </Button>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row justify-between space-y-0 text-sm">
            <CardTitle>Upcoming album</CardTitle>
            {daysUntilUpcomingAlbum !== null && (
              <span>
                {daysUntilUpcomingAlbum === 0
                  ? "Today"
                  : daysUntilUpcomingAlbum === 1
                    ? "Tomorrow"
                    : `in ${daysUntilUpcomingAlbum} ${daysUntilUpcomingAlbum === 1 ? "day" : "days"}`}
              </span>
            )}
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            {upcomingAlbum ? (
              <>
                <div className="h-32 w-32 rounded-sm bg-slate-200"></div>
                <div>
                  <h3 className="text-xl font-semibold">
                    {upcomingAlbum?.album.artist}
                  </h3>
                  <p className="text-muted-foreground">
                    {upcomingAlbum?.album.title}
                  </p>

                  {upcomingAlbum.userProgress[0]?.hasListened ? (
                    <Button variant="outline" className="mt-2" asChild>
                      <Link
                        href={`/clubs/${club.id}/albums/${upcomingAlbum?.id}`}
                      >
                        <ChartColumnStacked className="mr-2 h-4 w-4" />
                        Explore reviews
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="mt-2" asChild>
                      <Link
                        href={`/clubs/${club.id}/albums/${upcomingAlbum?.id}/progress`}
                      >
                        <NotebookPen className="mr-2 h-4 w-4" />
                        Track progress
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">No upcoming album</p>
              </div>
            )}
          </CardContent>
        </Card>
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
      </div> */}
    </div>
  );
}

function ClubPageIsNotMember({ club }: { club: SelectClub }) {
  return (
    <div>
      <ButtonJoinClub clubId={club.id} className="ml-6" />
    </div>
  );
}

function getDaysUntilUpcomingAlbum(scheduledFor: string | null | undefined) {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "UTC" }),
  );
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;

  return scheduledDate ? differenceInDays(scheduledDate, today) : null;
}

async function getClubWithAlbums(clubId: number) {
  return db.query.clubs.findFirst({
    where: (clubs, { eq }) => eq(clubs.id, clubId),
    with: {
      image: true,
      clubAlbums: {
        with: {
          album: true,
        },
      },
    },
  });
}

async function getUserClubMembership(clubId: number, userId: number) {
  return db.query.clubMembers.findFirst({
    where: (clubMembers, { eq, and }) =>
      and(
        eq(clubMembers.clubId, clubId),
        eq(clubMembers.userId, userId),
        eq(clubMembers.isActive, true),
      ),
  });
}

/* TODO @matthewalbrecht: this query is slow and should be optimized */
async function getUpcomingAlbums(clubId: number, userId: number) {
  const formattedToday = format(new Date(), "yyyy-MM-dd");

  return db.query.clubAlbums.findMany({
    where: (clubAlbums, { and, eq }) => and(eq(clubAlbums.clubId, clubId)),
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
