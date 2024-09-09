"use client";

import { z } from "zod";
import { useQueryState, parseAsInteger } from "nuqs";

import { FormRecordClubCreateMeta } from "./_components/form-record-club-create-meta";
import { FormRecordClubCreateSchedule } from "./_components/form-record-club-create-schedule";

export const createClubSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image: z.string().nullable(),
});

export type CreateClubForm = z.infer<typeof createClubSchema>;

export default function ClubsCreatePage() {
  const [step, setStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const [clubId, setClubId] = useQueryState("clubId", parseAsInteger);

  if (step === 1) {
    return <FormRecordClubCreateMeta setStep={setStep} setClubId={setClubId} />;
  }
  if (step === 2) {
    return <FormRecordClubCreateSchedule setStep={setStep} clubId={clubId} />;
  }
}
