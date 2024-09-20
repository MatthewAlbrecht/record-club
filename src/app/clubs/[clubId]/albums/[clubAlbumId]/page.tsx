import { db } from "~/server/db";
import { TableClubAlbumStats } from "./_components/table-club-album-stats/table-club-album-stats";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function DemoPage({
  params: { clubId, clubAlbumId },
}: {
  params: { clubId: string; clubAlbumId: string };
}) {
  const clubQuestions = await db.query.clubQuestions.findMany({
    where: (clubQuestions, { eq }) => eq(clubQuestions.clubId, Number(clubId)),
    with: {
      question: true,
    },
  });

  const userProgressions = await db.query.userClubAlbumProgress.findMany({
    where: (userClubAlbumProgress, { eq, and }) =>
      and(
        eq(userClubAlbumProgress.clubAlbumId, Number(clubAlbumId)),
        eq(userClubAlbumProgress.hasListened, true),
      ),
    with: {
      answers: true,
      user: true,
    },
  });

  return (
    <div>
      <div>
        <Button variant="ghost" asChild>
          <Link href={`/clubs/${clubId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to club
          </Link>
        </Button>
      </div>
      <TableClubAlbumStats
        clubQuestions={clubQuestions}
        userProgressions={userProgressions}
      />
    </div>
  );
}
