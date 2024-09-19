import { db } from "~/server/db";

export type ClubWithAlbums = Awaited<ReturnType<typeof getClubWithAlbums>>;

export function getClubWithAlbums(clubId: number) {
  return db.query.clubs.findFirst({
    where: (clubs, { eq }) => eq(clubs.id, clubId),
    with: {
      clubAlbums: {
        columns: {
          id: true,
          scheduledFor: true,
        },
        orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
        with: {
          album: {
            columns: {
              id: true,
              title: true,
              artist: true,
            },
          },
        },
      },
    },
  });
}
