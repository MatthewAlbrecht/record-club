"use server"; // don't forget to add this!

import { z } from "zod";
import { authActionClient } from "~/lib/safe-action";
import { db } from "../db";
import { albums, clubs } from "../db/schema";
import { DatabaseError, PGErrorCodes } from "./utils";

// This schema is used to validate input from client.
const createAlbumSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  releaseDate: z.string().optional(),
});

export const createAlbum = authActionClient
  .metadata({ actionName: "createAlbum" })
  .schema(createAlbumSchema)
  .action(
    async ({
      parsedInput: { title, artist, releaseDate },
      ctx: { userId },
    }) => {
      const releaseYear = releaseDate
        ? new Date(releaseDate).getFullYear()
        : null;
      const releaseMonth = releaseDate
        ? new Date(releaseDate).getMonth() + 1
        : null;
      const releaseDay = releaseDate ? new Date(releaseDate).getDate() : null;

      try {
        const album = await db
          .insert(albums)
          .values({
            title,
            artist,
            releaseYear,
            releaseMonth,
            releaseDay,
          })
          .returning();

        return { album: album[0]! };
      } catch (error) {
        if (error instanceof Error) {
          throw new DatabaseError(
            {
              [PGErrorCodes.UniqueConstraintViolation]: "Album already exists",
            },
            { cause: error },
          );
        }
        throw error;
      }
    },
  );