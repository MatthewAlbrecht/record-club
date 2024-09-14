import { type NextRequest } from "next/server";
import { db } from "~/server/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const albums = await db.query.albums.findMany({
    where: (album, { like, or }) =>
      or(
        search ? like(album.title, `%${search}%`) : undefined,
        search ? like(album.artist, `%${search}%`) : undefined,
      ),
  });

  return Response.json({ albums });
}
