"use server"; // don't forget to add this!

import { z } from "zod";
import {
  ActionError,
  authActionClient,
  DatabaseError,
  PGErrorCodes,
} from "~/lib/safe-action";
import { db } from "../db";
import { clubAlbums, clubQuestions, clubs } from "../db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// This schema is used to validate input from client.
const createClubSchema = z.object({
  name: z.string().min(3).max(128),
  description: z.string().min(3).max(2048),
});

export const createClub = authActionClient
  .metadata({ actionName: "createClub" })
  .schema(createClubSchema)
  .action(async ({ parsedInput: { name, description }, ctx: { userId } }) => {
    const club = await db
      .insert(clubs)
      .values({ name, description, createdById: userId, ownedById: userId })
      .returning();
    revalidatePath("/clubs/create");
    return { club: club[0]! };
  });

const addAlbumToClubSchema = z.object({
  clubId: z.number(),
  albumId: z.number(),
  scheduledFor: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Invalid date format, should match yyyy-MM-dd",
    ),
});

export const addAlbumToClub = authActionClient
  .metadata({ actionName: "addAlbumToClub" })
  .schema(addAlbumToClubSchema)
  .action(
    async ({
      parsedInput: { clubId, albumId, scheduledFor },
      ctx: { userId },
    }) => {
      const club = await db.query.clubs.findFirst({
        where: (club, { eq }) => eq(club.id, clubId),
      });

      if (!club) {
        throw new ActionError("Club not found");
      }

      if (club.ownedById !== userId) {
        throw new ActionError("You are not the owner of this club");
      }

      console.log("HEREE", scheduledFor);

      try {
        const clubAlbum = await db
          .insert(clubAlbums)
          .values({
            clubId,
            albumId,
            scheduledFor: scheduledFor,
            createdById: userId,
          })
          .returning();
        revalidatePath("/clubs/create");
        return { clubAlbum: clubAlbum[0]! };
      } catch (error) {
        if (error instanceof Error) {
          throw new DatabaseError(
            {
              [PGErrorCodes.UniqueConstraintViolation]:
                "Cannot add multiple albums on the same day",
            },
            { cause: error },
          );
        }
        throw Error;
      }
    },
  );

const deleteAlbumSchema = z.object({
  clubAlbumId: z.number(),
});

export const deleteClubAlbum = authActionClient
  .metadata({ actionName: "deleteClubAlbum" })
  .schema(deleteAlbumSchema)
  .action(async ({ parsedInput: { clubAlbumId } }) => {
    await db.delete(clubAlbums).where(eq(clubAlbums.id, clubAlbumId));
    revalidatePath("/clubs/create");
    return { success: true };
  });

const selectClubQuestionsSchema = z.object({
  questionIds: z.array(z.number()),
  clubId: z.number(),
});

export const selectClubQuestions = authActionClient
  .metadata({ actionName: "selectClubQuestions" })
  .schema(selectClubQuestionsSchema)
  .action(async ({ parsedInput: { questionIds, clubId }, ctx: { userId } }) => {
    const club = await db.query.clubs.findFirst({
      where: (club, { eq }) => eq(club.id, clubId),
    });

    if (!club) {
      throw new ActionError("Club not found");
    }

    if (club.ownedById !== userId) {
      throw new ActionError("You are not the owner of this club");
    }

    console.log("HEREE");

    await db.transaction(async (trx) => {
      await trx.insert(clubQuestions).values(
        questionIds.map((questionId) => ({
          clubId,
          questionId,
          createdById: userId,
        })),
      );

      console.log("HEREE222222");
      await trx
        .update(clubs)
        .set({ isActive: true })
        .where(eq(clubs.id, clubId));
      console.log("HEREE3333");
    });

    console.log("HEREE444444");
    return { success: true };
  });
