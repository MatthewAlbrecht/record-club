"use client"

import { toast } from "sonner"
import { UploadDropzone } from "~/lib/uploadthing"
import type { GetClubWithAlbums } from "~/server/api/queries"
import Image from "next/image"
import type { SelectImage } from "~/server/db/schema"
import { useState } from "react"
import { useDebounce } from "~/lib/hooks/useDebounce"
import { updateClubImageFocalPoint } from "~/server/api/clubs-actions"
import { useAction } from "next-safe-action/hooks"

export function FormClubGeneralInfo({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	return (
		<div>
			<h1 className="text-base font-semibold leading-7 text-slate-900">
				Cover photo
			</h1>
			<p className="mt-1 text-sm leading-6 text-slate-600">
				Upload a cover photo for your club and choose a focal point.
			</p>

			<div className="max-w-3xl">
				{club.image ? (
					<FocalPointPicker club={club} image={club.image} />
				) : (
					<UploadDropzone
						endpoint="clubCoverPhoto"
						input={{ clubId: club.id }}
						onUploadBegin={() => {
							toast.loading("Uploading...")
						}}
						onClientUploadComplete={(res) => {
							toast.success("Upload Completed")
						}}
						onUploadError={(error: Error) => {
							toast.error(error.message)
						}}
					/>
				)}
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
		<div className="mt-4 rounded-lg overflow-hidden relative group">
			<div className="absolute inset-0  flex items-start justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ease-out duration-300">
				<p className="text-white text-lg font-medium mt-4">
					Adjust the focal point
				</p>
			</div>
			<Image
				src={image.url}
				alt="Club cover photo"
				width={400}
				height={400}
				className="w-full h-auto"
			/>
			<div
				className="absolute inset-0 cursor-move"
				onDragOver={(e) => e.preventDefault()}
				onDrop={handleDrag}
				onDragEnd={handleDragEnd}
			>
				<div
					className={`absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg ${
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
