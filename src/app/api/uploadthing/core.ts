import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { z } from "zod"
import { db } from "~/server/db"
import { clubs, images } from "~/server/db/schema"

const f = createUploadthing()

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
			// This code RUNS ON YOUR SERVER after upload
			console.log("Upload complete for userId:", metadata.userId)

			console.log("file url", file.url)

			// Create a transaction to add the image and update the club
			const newImage = await db.transaction(async (tx) => {
				// Insert the new image
				const [newImage] = await tx
					.insert(images)
					.values({
						url: file.url,
						uploadedById: metadata.userId,
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

			revalidatePath(`/clubs/${metadata.clubId}/settings`)

			// !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
			return {
				uploadedBy: metadata.userId,
				url: newImage.url,
				id: newImage.id,
			}
		}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
