import { db } from "~/server/db";
import { notFound } from "next/navigation";

import { FormQuestionnaire } from "./_components/form-questionnaire";
import { auth } from "@clerk/nextjs/server";
import { getAuthenticatedUser } from "~/server/api/queries";

interface ProgressPageProps {
  params: {
    clubId: string;
    clubAlbumId: string;
  };
}

export default async function ProgressPage({
  params: { clubId, clubAlbumId },
}: ProgressPageProps) {
  const parsedClubId = Number(clubId);
  const parsedClubAlbumId = Number(clubAlbumId);

  const user = await getAuthenticatedUser();

  if (isNaN(parsedClubId) || isNaN(parsedClubAlbumId)) {
    notFound();
  }

  const clubAlbum = await db.query.clubAlbums.findFirst({
    where: (clubAlbums, { eq, and }) =>
      and(
        eq(clubAlbums.id, parsedClubAlbumId),
        eq(clubAlbums.clubId, parsedClubId),
      ),
    with: {
      album: true,
    },
  });

  if (!clubAlbum) {
    notFound();
  }

  const questions = await db.query.clubQuestions.findMany({
    where: (clubQuestions, { eq }) => eq(clubQuestions.clubId, parsedClubId),
    with: {
      question: true,
    },
  });

  const answers = await db.query.answers.findMany({
    where: (answers, { eq, and }) =>
      and(eq(answers.clubAlbumId, clubAlbum.id), eq(answers.userId, user.id)),
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-4">
        <div className="h-32 w-32 rounded-sm bg-slate-200"></div>
        <div>
          <h1 className="text-2xl font-bold">{clubAlbum.album.artist}</h1>
          <p className="text-muted-foreground">{clubAlbum.album.title}</p>
        </div>
      </div>
      <FormQuestionnaire
        questions={questions}
        answers={answers}
        clubAlbumId={clubAlbum.id}
        clubId={Number(clubId)}
      />
    </div>
  );
}
