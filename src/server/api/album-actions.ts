"use server"

import { z } from "zod"
import { authActionClient, authAndSpotifyActionClient } from "~/lib/safe-action"
import { db } from "../db"
import { type InsertAlbum, albumArtists, albums, artists } from "../db/schema"
import type { SimplifiedArtist, SpotifyAlbum } from "../spotify"
import { DatabaseError, PGErrorCodes } from "./utils"
import { sql } from "drizzle-orm"

const createAlbumSchema = z.object({
	title: z.string().min(1),
	artist: z.string().min(1),
	releaseDate: z.string().optional(),
})

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
				: null
			const releaseMonth = releaseDate
				? new Date(releaseDate).getMonth() + 1
				: null
			const releaseDay = releaseDate ? new Date(releaseDate).getDate() : null

			try {
				const [album] = await db
					.insert(albums)
					.values({
						title,
						artist,
						releaseYear,
						releaseMonth,
						releaseDay,
					})
					.returning()

				if (!album) {
					throw new Error("Failed to insert album")
				}

				return { album }
			} catch (error) {
				if (error instanceof Error) {
					throw new DatabaseError(
						{
							[PGErrorCodes.UniqueConstraintViolation]: "Album already exists",
						},
						{ cause: error },
					)
				}
				throw error
			}
		},
	)

const getAlbumBySpotifyURISchema = z.object({
	spotifyURI: z.string().min(1),
})

export const getAlbumBySpotifyURI = authAndSpotifyActionClient
	.metadata({ actionName: "getAlbumBySpotifyURI" })
	.schema(getAlbumBySpotifyURISchema)
	.action(
		async ({
			ctx: { userId, spotifyAccessToken },
			parsedInput: { spotifyURI },
		}) => {
			const response = await fetch(
				`https://api.spotify.com/v1/albums/${spotifyURI}`,
				{
					headers: {
						Authorization: `Bearer ${spotifyAccessToken}`,
					},
				},
			)

			console.log("Response ->", response)
			console.log("Response.ok ->", response.ok)
			console.log("Response.status ->", response.status)
			console.log("Response.statusText ->", response.statusText)

			// TODO: handle case where album is not found
			// TODO: possibly validate with zod
			const album: SpotifyAlbum = await response.json()

			if (!album) {
				throw new Error("Failed to get album")
			}

			try {
				const albumToInsert = {
					title: album.name,
					name: album.name,
					// biome-ignore lint/style/noNonNullAssertion: at least one artist is returned
					artist: album.artists[0]!.name,
					releaseDate: album.release_date,
					releaseDatePrecision: album.release_date_precision,
					albumType: album.album_type,
					spotifyId: album.id,
					totalTracks: album.total_tracks,
					genres: album.genres,
					isrc: album.external_ids.isrc,
					ean: album.external_ids.ean,
					upc: album.external_ids.upc,
					...getTracks(album),
					...getLargestImage(album),
				} satisfies InsertAlbum

				const artistsToInsert = dedupeArtists([
					...album.artists,
					...getArtistsFromTracks(album),
				]).map((artist) => ({
					name: artist.name,
					spotifyId: artist.id,
				}))

				const albumToReturn = await db.transaction(async (tx) => {
					const [insertedAlbum] = await tx
						.insert(albums)
						.values(albumToInsert)
						.onConflictDoUpdate({
							target: albums.spotifyId,
							set: albumToInsert,
						})
						.returning()
					if (!insertedAlbum) {
						throw new Error("Failed to insert album")
					}

					const insertedArtists = await tx
						.insert(artists)
						.values(artistsToInsert)
						.onConflictDoUpdate({
							target: artists.spotifyId,
							set: {
								name: sql`EXCLUDED.name`,
							},
						})
						.returning()
					if (!insertedArtists) {
						throw new Error("Failed to insert artists")
					}

					const albumArtistsToInsert = insertedArtists.map((artist) => ({
						albumId: insertedAlbum.id,
						artistId: artist.id,
					}))

					await tx
						.insert(albumArtists)
						.values(albumArtistsToInsert)
						.onConflictDoNothing()
					return insertedAlbum
				})

				return { album: albumToReturn }
			} catch (err) {
				console.error(err)
				throw err
			}
		},
	)

function getTracks(album: SpotifyAlbum) {
	return {
		tracks: album.tracks.items.map((track) => ({
			name: track.name,
			preview_url: track.preview_url,
			duration_ms: track.duration_ms,
			id: track.id,
			track_number: track.track_number,
		})),
	}
}

function getLargestImage(album: SpotifyAlbum) {
	const largestImage = album.images.reduce((largest, current) => {
		if (!largest.width) return current
		if (!current.width) return largest
		return largest.width > current.width ? largest : current
	})

	return {
		spotifyImageUrl: largestImage.url,
		spotifyImageWidth: largestImage.width,
		spotifyImageHeight: largestImage.height,
	}
}

function getArtistsFromTracks(album: SpotifyAlbum) {
	return album.tracks.items.flatMap((track) => track.artists)
}

function dedupeArtists(artists: SimplifiedArtist[]) {
	return artists.filter(
		(artist, index, self) =>
			index === self.findIndex((t) => t.id === artist.id),
	)
}
