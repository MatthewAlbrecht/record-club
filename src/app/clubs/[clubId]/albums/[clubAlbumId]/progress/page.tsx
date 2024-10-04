import { auth } from "@clerk/nextjs/server"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "~/server/db"
import { FormQuestionnaire } from "./_components/form-questionnaire"
interface ProgressPageProps {
	params: {
		clubId: string
		clubAlbumId: string
	}
}

export default async function ProgressPage({
	params: { clubId, clubAlbumId },
}: ProgressPageProps) {
	const parsedClubId = Number(clubId)
	const parsedClubAlbumId = Number(clubAlbumId)

	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	if (Number.isNaN(parsedClubId) || Number.isNaN(parsedClubAlbumId)) {
		notFound()
	}

	const clubAlbum = await db.query.clubAlbums.findFirst({
		where: (clubAlbums, { eq, and }) =>
			and(
				eq(clubAlbums.id, parsedClubAlbumId),
				eq(clubAlbums.clubId, parsedClubId),
			),
		with: {
			album: true,
			club: {
				with: {
					image: true,
				},
			},
		},
	})

	if (!clubAlbum) {
		notFound()
	}

	const questions = await db.query.clubQuestions.findMany({
		where: (clubQuestions, { eq, and, isNull }) =>
			and(
				eq(clubQuestions.clubId, parsedClubId),
				isNull(clubQuestions.inactiveAt),
			),
		orderBy: (clubQuestions, { asc }) => [asc(clubQuestions.order)],
		with: {
			question: true,
		},
	})

	const answers = await db.query.answers.findMany({
		where: (answers, { eq, and }) =>
			and(eq(answers.clubAlbumId, clubAlbum.id), eq(answers.userId, userId)),
	})

	const album = clubAlbum.album

	return (
		<div className="mx-auto max-w-sm overflow-hidden rounded-xl shadow-xl">
			<div className="relative h-48 w-full bg-gradient-to-bl from-slate-50 to-slate-200">
				{clubAlbum.club.image && (
					<Image
						src={clubAlbum.club.image.url}
						alt={clubAlbum.club.name}
						className="object-cover"
						fill
						style={{
							objectPosition: `${clubAlbum.club.image.focalPointX}% ${clubAlbum.club.image.focalPointY}%`,
						}}
					/>
				)}
				<div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-b from-transparent to-black/80 p-4">
					<div className="flex items-center space-x-4">
						{album.spotifyImageUrl ? (
							<Image
								src={album.spotifyImageUrl}
								alt={album.name}
								width={12 * 4}
								height={12 * 4}
								className="rounded-sm"
							/>
						) : (
							<div className="h-12 w-12 rounded-sm bg-slate-200" />
						)}
						<div>
							<h1 className="font-bold text-lg text-slate-50">
								{clubAlbum.album.artistNames}
							</h1>
							<p className="text-slate-300 text-sm">{clubAlbum.album.name}</p>
						</div>
					</div>
				</div>
			</div>
			<div className="p-4">
				<FormQuestionnaire
					questions={questions}
					answers={answers}
					clubAlbumId={clubAlbum.id}
					clubId={Number(clubId)}
				/>
			</div>
		</div>
	)
}
