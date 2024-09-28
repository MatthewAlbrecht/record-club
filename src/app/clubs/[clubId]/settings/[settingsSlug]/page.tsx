import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Routes } from "~/lib/routes"
import {
	getActiveClubMemberById,
	getClubWithAlbums,
} from "~/server/api/queries"
import { TableClubMembers } from "../_components/data-table-club-members/table-club-members"
import { FormClubGeneralInfo } from "../_components/form-club-general-info"
import { PageClubSettingsSchedule } from "../_components/page-club-schedule"
import { PageClubSettingsQuestions } from "../_components/page-club-settings-questions"

export default async function ClubSettingsPage({
	params: { clubId, settingsSlug },
}: { params: { clubId: string; settingsSlug: string } }) {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	if (Number.isNaN(Number(clubId))) {
		return notFound()
	}

	if (!["schedule", "members", "general", "questions"].includes(settingsSlug)) {
		return notFound()
	}

	const membership = await getActiveClubMemberById(Number(clubId), userId)

	const isAdminOrOwner =
		membership?.role === "owner" || membership?.role === "admin"
	if (!isAdminOrOwner) {
		return notFound()
	}

	const club = await getClubWithAlbums(Number(clubId))

	if (!club) {
		return notFound()
	}

	return (
		<Tabs value={settingsSlug} className="w-full">
			<TabsList>
				<Link href={Routes.ClubSettings(club.id, "schedule")}>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
				</Link>
				<Link href={Routes.ClubSettings(club.id, "members")}>
					<TabsTrigger value="members">Members</TabsTrigger>
				</Link>
				<Link href={Routes.ClubSettings(club.id, "general")}>
					<TabsTrigger value="general">General</TabsTrigger>
				</Link>
				<Link href={Routes.ClubSettings(club.id, "questions")}>
					<TabsTrigger value="questions">Questions</TabsTrigger>
				</Link>
			</TabsList>
			<TabsContent value="schedule" className="mt-0">
				<PageClubSettingsSchedule club={club} />
			</TabsContent>
			<TabsContent value="members" className="mt-0">
				<h2 className="text-xl font-bold my-8">Members</h2>
				<TableClubMembers club={club} />
			</TabsContent>
			<TabsContent value="general" className="mt-0">
				<h2 className="text-xl font-bold my-8">General Information</h2>
				<FormClubGeneralInfo club={club} />
			</TabsContent>
			<TabsContent value="questions" className="mt-0">
				<PageClubSettingsQuestions club={club} />
			</TabsContent>
		</Tabs>
	)
}
