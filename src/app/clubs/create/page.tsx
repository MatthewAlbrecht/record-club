import { z } from "zod";
import { db } from "~/server/db";
import { clubAlbums } from "~/server/db/schema";
import { eq } from "drizzle-orm";

import { FormRecordClubCreateMeta } from "./_components/form-record-club-create-meta";
import { FormRecordClubCreateSchedule } from "./_components/form-record-club-create-schedule";
import { FormRecordClubQuestionSelection } from "./_components/form-record-club-question-selection";

export default async function ClubsCreatePage({
  searchParams,
}: {
  searchParams: { step?: string; clubId?: string };
}) {
  const step = Number(searchParams.step);
  const clubId = Number(searchParams.clubId);

  const clubAlbumsData = clubId
    ? await db.query.clubAlbums.findMany({
        where: eq(clubAlbums.clubId, clubId),
        orderBy: (clubAlbums, { asc }) => [asc(clubAlbums.scheduledFor)],
        with: {
          album: true,
        },
      })
    : null;

  const questions = step === 3 ? await db.query.questions.findMany() : null;

  if (!step || step === 1) {
    return <FormRecordClubCreateMeta />;
  }
  if (clubId && step === 2) {
    return (
      <FormRecordClubCreateSchedule
        clubAlbums={clubAlbumsData}
        clubId={clubId}
      />
    );
  }
  if (step === 3 && clubId) {
    return (
      <FormRecordClubQuestionSelection questions={questions!} clubId={clubId} />
    );
  }
  return null;
}
