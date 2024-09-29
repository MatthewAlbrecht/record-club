"use client"

import { useAction } from "next-safe-action/hooks"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { useDebounce } from "~/lib/hooks/useDebounce"
import { UploadButton, UploadDropzone } from "~/lib/uploadthing"
import { updateClubImageFocalPoint } from "~/server/api/clubs-actions"
import type { GetClubWithAlbums } from "~/server/api/queries"
import type { SelectImage } from "~/server/db/schema"
import { FormRecordClubModifyMeta } from "./form-club-modify-meta"

export function FormClubGeneralInfo({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	const router = useRouter()
	return (
		<div className="divide-y">
			<div className="pb-8">
				<h1 className="font-semibold text-base text-slate-900 leading-7">
					Cover photo
				</h1>
				<p className="mt-1 text-slate-600 text-sm leading-6">
					Upload a cover photo for your club and choose a focal point.
				</p>

				<div className="max-w-3xl">
					{club.image ? (
						<div>
							<FocalPointPicker club={club} image={club.image} />
							<div className="mt-2 flex justify-start">
								<UploadButton
									endpoint="resetClubCoverPhoto"
									input={{ clubId: club.id }}
									onClientUploadComplete={(res) => {
										toast.success("Upload Completed")
										router.refresh()
									}}
								/>
							</div>
						</div>
					) : (
						<UploadDropzone
							endpoint="clubCoverPhoto"
							input={{ clubId: club.id }}
							onClientUploadComplete={(res) => {
								toast.success("Upload Completed")
								router.refresh()
							}}
							onUploadError={(error: Error) => {
								toast.error(error.message)
							}}
						/>
					)}
				</div>
			</div>
			<div className="pt-8">
				<FormRecordClubModifyMeta club={club} />
			</div>
		</div>
	)
}

function FocalPointPicker({
	club,
	image,
}: {
	club: NonNullable<GetClubWithAlbums>
	image: SelectImage
}) {
	const [focalPoint, setFocalPoint] = useState({
		x: image.focalPointX,
		y: image.focalPointY,
	})
	const [isDragging, setIsDragging] = useState(false)
	const { execute } = useAction(updateClubImageFocalPoint, {
		onSuccess: () => {
			toast.success("Focal point updated")
		},
		onError: (error) => {
			toast.error("Failed to update focal point")
		},
	})

	const updateFocalPoint = useDebounce(execute, 500)

	const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
		setIsDragging(true)
	}

	const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
		const container = e.currentTarget.getBoundingClientRect()
		let x = ((e.clientX - container.left) / container.width) * 100
		let y = ((e.clientY - container.top) / container.height) * 100
		if (x < 0) x = 0
		if (x > 100) x = 100
		if (y < 0) y = 0
		if (y > 100) y = 100
		setFocalPoint({ x, y })
		setIsDragging(false)
		updateFocalPoint({ x, y, clubId: club.id })
	}

	return (
		<div className="group relative mt-4 overflow-hidden rounded-lg">
			<div className="absolute inset-0 flex items-start justify-center bg-black/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
				<p className="mt-4 font-medium text-lg text-white">
					Adjust the focal point
				</p>
			</div>
			<Image
				src={image.url}
				alt="Club cover photo"
				width={640}
				height={360}
				className="h-auto w-full"
			/>
			<div
				className="absolute inset-0 cursor-move"
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrag}
				onDragEnd={handleDragEnd}
			>
				<div
					className={`-translate-x-1/2 -translate-y-1/2 absolute h-6 w-6 rounded-full border-2 border-blue-500 bg-white shadow-lg ${
						isDragging ? "opacity-30" : ""
					}`}
					style={{ left: `${focalPoint.x}%`, top: `${focalPoint.y}%` }}
					draggable
					onDrag={handleDrag}
				/>
			</div>
		</div>
	)
}
