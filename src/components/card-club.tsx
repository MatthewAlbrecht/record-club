import type { SelectClub, SelectImage } from "~/server/db/schema"
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card"

import Image from "next/image"

export function CardClub({
	club,
}: {
	club: Pick<SelectClub, "id" | "name" | "shortDescription"> & {
		image:
			| (Pick<SelectImage, "url" | "focalPointX" | "focalPointY"> & {
					[key: string]: unknown
			  })
			| null
		[key: string]: unknown
	}
}) {
	return (
		<Card
			key={club.id}
			className="flex h-full flex-col overflow-hidden shadow-sm @container"
		>
			{club.image ? (
				<div className="relative h-40 w-full">
					<Image
						src={club.image.url}
						alt={club.name}
						className="object-cover"
						fill
						style={{
							objectPosition: `${club.image.focalPointX}% ${club.image.focalPointY}%`,
						}}
					/>
				</div>
			) : (
				<div className="h-40 w-full bg-gradient-to-bl from-slate-50 to-slate-200" />
			)}
			<CardHeader className="p-3 py-2 @xs:p-5 @xs:pt-3">
				<CardTitle className="mt-2 text-base text-slate-800">
					{club.name}
				</CardTitle>
				<CardDescription className="text-sm text-slate-500">
					{club.shortDescription}
				</CardDescription>
			</CardHeader>
		</Card>
	)
}
