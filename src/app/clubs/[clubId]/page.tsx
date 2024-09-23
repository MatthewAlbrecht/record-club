import { Button } from "~/components/ui/button";

import { Settings, ArrowRight } from "lucide-react";
import { db } from "~/server/db";
import { notFound } from "next/navigation";
import { SelectClub } from "~/server/db/schema";
import Link from "next/link";
import { ButtonJoinClub } from "./button-club-actions";
import { differenceInDays, format } from "date-fns";
import { getAuthenticatedUser } from "~/server/api/queries";
import { Routes } from "~/lib/routes";
import Image from "next/image";

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
  const isOwnerOrAdmin =
    club.ownedById === user.id || membership?.role === "admin";
  const isMember = !!membership;

  return isMember ? (
    <ClubPageIsMember club={club} isOwnerOrAdmin={isOwnerOrAdmin} />
  ) : (
    <ClubPageIsNotMember club={club} />
  );
}

type Club = NonNullable<Awaited<ReturnType<typeof getClubWithAlbums>>>;

async function ClubPageIsMember({
  club,
  isOwnerOrAdmin,
}: {
  club: Club;
  isOwnerOrAdmin: boolean;
}) {
  const user = await getAuthenticatedUser();
  const upcomingAlbums = await getUpcomingAlbums(club.id, user.id);

  return (
    <div className="@container">
      <div className="relative -mx-main-inner -mt-main-inner">
        {club.image ? (
          <div className="relative h-48 w-full @md:h-64 @lg:h-96">
            <Image
              src={club.image.url}
              alt={club.name}
              fill
              className="object-cover"
              style={{
                objectPosition: club.image.focalPoint ?? "center",
              }}
            />
          </div>
        ) : (
          <div className="aspect-video h-64"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80">
          <div className="flex h-full flex-col justify-between p-main-inner">
            <div className="flex flex-row justify-end">
              {isOwnerOrAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  aria-label="Club Settings"
                  className="px-2 text-slate-50"
                >
                  <Link href={Routes.ClubSettings(club.id)}>
                    <Settings className="h-6 w-6" />
                  </Link>
                </Button>
              )}
            </div>
            <div>
              <h1 className="text-5xl font-bold text-slate-50">{club.name}</h1>
              <p className="mt-3 max-w-prose text-xl text-muted-foreground text-slate-300">
                {club.shortDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <div className="flex flex-col gap-6">
          <h2 className="text-sm font-medium text-slate-500">
            Upcoming albums
          </h2>
          <ul className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @2xl:gap-6 @5xl:grid-cols-3 @5xl:gap-8">
            {upcomingAlbums.length > 0 ? (
              upcomingAlbums
                // .slice(0, 3)
                .map((clubAlbum) => (
                  <UpcomingAlbums key={clubAlbum.id} clubAlbum={clubAlbum} />
                ))
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">No upcoming albums</p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function UpcomingAlbums({ clubAlbum }: { clubAlbum: ClubAlbum }) {
  const relativeDate = getRelativeDateLabel(clubAlbum.scheduledFor);

  return (
    <li key={clubAlbum.id}>
      <Link
        href={
          clubAlbum.userProgress[0]?.hasListened
            ? `/clubs/${clubAlbum.club.id}/albums/${clubAlbum.id}`
            : `/clubs/${clubAlbum.club.id}/albums/${clubAlbum.id}/progress`
        }
        className="-mx-2 flex h-full flex-row items-center gap-2 rounded-md bg-slate-50 p-2 hover:bg-slate-100"
      >
        <div className="h-24 w-24 flex-shrink-0 rounded-sm bg-slate-200"></div>
        <div className="flex h-full flex-grow flex-col justify-between overflow-hidden py-2">
          <div className="min-w-0">
            <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-lg font-medium text-slate-700">
              {clubAlbum.album.artist}
            </h3>
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-500">
              {clubAlbum.album.title}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-slate-500">{relativeDate}</span>
            <div className="flex flex-row items-center gap-1 text-sm text-slate-500">
              {clubAlbum.userProgress[0]?.hasListened
                ? "Explore reviews"
                : "Track progress"}
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function ClubPageIsNotMember({ club }: { club: SelectClub }) {
  return (
    <div>
      <ButtonJoinClub clubId={club.id} className="ml-6" />
    </div>
  );
}

function getRelativeDateLabel(scheduledFor: string | null | undefined) {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "UTC" }),
  );
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;

  if (!scheduledDate) return null;

  const delta = differenceInDays(scheduledDate, today);

  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  if (delta === -1) return "Yesterday";
  if (delta < -1 && delta >= -7) return `${-delta} days ago`;
  if (delta > 1 && delta <= 7) return `in ${delta} days`;

  return format(scheduledDate, "MMM d, yyyy");
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

type ClubAlbum = Awaited<ReturnType<typeof getUpcomingAlbums>>[number];
