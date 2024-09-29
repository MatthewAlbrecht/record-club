import type { NextRequest } from "next/server"
import { db } from "~/server/db"

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url)
	const search = searchParams.get("search")

	const albums = await db.query.albums.findMany({
		where: (album, { ilike, or }) =>
			or(
				search ? ilike(album.name, `%${search}%`) : undefined,
				search ? ilike(album.artistNames, `%${search}%`) : undefined,
			),
	})

	return Response.json({ albums })
}
