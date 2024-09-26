import { auth } from "@clerk/nextjs/server"
import { Ratelimit } from "@upstash/ratelimit"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { type FileRouter, createUploadthing } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { z } from "zod"
import { db, redis } from "~/server/db"
import { clubs, images } from "~/server/db/schema"
import { utapi } from "~/server/uploadthing"

const f = createUploadthing()

const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.slidingWindow(2, "1 m"),
	prefix: "@record-clubs/image-upload",
	// analytics: true,
})

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	clubCoverPhoto: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
		.input(z.object({ clubId: z.number() }))
		// Set permissions and file types for this FileRoute
		.middleware(async ({ req, input }) => {
			// This code runs on your server before upload
			const { userId } = await auth()

			if (!userId) throw new UploadThingError("Unauthorized")

			const { success } = await ratelimit.limit(userId)

			if (!success) {
				throw new Error("Rate limit exceeded")
			}

			const clubMember = await db.query.clubMembers.findFirst({
				where: (clubMembers, { eq, and }) =>
					and(
						eq(clubMembers.clubId, input.clubId),
						eq(clubMembers.userId, userId),
					),
			})

			if (!clubMember || clubMember.role !== "owner") {
				throw new UploadThingError("Unauthorized")
			}

			const user = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, userId),
			})

			// If you throw, the user will not be able to upload
			if (!user) throw new UploadThingError("Unauthorized")

			// Whatever is returned here is accessible in onUploadComplete as `metadata`
			return { userId: user.id, clubId: input.clubId }
		})

		.onUploadComplete(async ({ metadata, file }) => {
			// Create a transaction to add the image and update the club
			const newImage = await db.transaction(async (tx) => {
				// Insert the new image
				const [newImage] = await tx
					.insert(images)
					.values({
						url: file.url,
						uploadedById: metadata.userId,
						key: file.key,
					})
					.returning()

				if (!newImage) {
					throw new Error("Failed to insert image")
				}

				// Update the club with the new image ID
				await tx
					.update(clubs)
					.set({ imageId: newImage.id })
					.where(eq(clubs.id, metadata.clubId))

				return newImage
			})

			revalidatePath(`/clubs/${metadata.clubId}/settings/general`)

			// !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
			return {
				success: true,
			}
		}),

	resetClubCoverPhoto: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
		.input(z.object({ clubId: z.number() }))
		// Set permissions and file types for this FileRoute
		.middleware(async ({ req, input }) => {
			// This code runs on your server before upload
			const { userId } = await auth()

			if (!userId) throw new UploadThingError("Unauthorized")

			const { success } = await ratelimit.limit(userId)

			if (!success) {
				throw new Error("Rate limit exceeded")
			}

			const clubMember = await db.query.clubMembers.findFirst({
				where: (clubMembers, { eq, and }) =>
					and(
						eq(clubMembers.clubId, input.clubId),
						eq(clubMembers.userId, userId),
					),
				with: {
					club: {
						columns: {
							imageId: true,
						},
					},
				},
			})

			if (!clubMember || clubMember.role !== "owner") {
				throw new UploadThingError("Unauthorized")
			}

			const user = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.id, userId),
			})

			// If you throw, the user will not be able to upload
			if (!user) throw new UploadThingError("Unauthorized")

			// Whatever is returned here is accessible in onUploadComplete as `metadata`
			return {
				userId: user.id,
				clubId: input.clubId,
				imageId: clubMember.club.imageId,
			}
		})
		.onUploadComplete(async ({ metadata, file }) => {
			const newImage = await db.transaction(async (tx) => {
				const [newImage] = await tx
					.insert(images)
					.values({
						url: file.url,
						uploadedById: metadata.userId,
						key: file.key,
					})
					.returning()

				if (!newImage) {
					throw new Error("Failed to insert image")
				}

				await tx
					.update(clubs)
					.set({ imageId: newImage.id })
					.where(eq(clubs.id, metadata.clubId))

				return newImage
			})

			revalidatePath(`/clubs/${metadata.clubId}/settings/general`)

			const imageId = metadata.imageId

			if (imageId != null) {
				const image = await db.query.images.findFirst({
					where: (images, { eq }) => eq(images.id, imageId),
				})

				if (image) {
					await db.delete(images).where(eq(images.id, imageId))
					await utapi.deleteFiles(image.key)
				}
			}

			return {
				success: true,
			}
		}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
