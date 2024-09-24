import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { db } from "~/server/db"
import { getClubWithAlbums } from "./_queries"
import { FormRecordClubModifySchedule } from "./form-record-club-modify-schedule"
import { TableClubMembers } from "./table-club-members"

export default async function ClubSettingsPage({
	params,
}: {
	params: { clubId: string }
}) {
	const { userId } = auth()

	if (!userId) {
		return notFound()
	}

	const membership = await db.query.clubMembers.findFirst({
		where: (clubMembers, { eq, and, isNull }) =>
			and(
				eq(clubMembers.clubId, Number(params.clubId)),
				eq(clubMembers.userId, userId),
				isNull(clubMembers.inactiveAt),
				isNull(clubMembers.blockedAt),
			),
	})

	const isAdminOrOwner =
		membership?.role === "owner" || membership?.role === "admin"
	if (!isAdminOrOwner) {
		return notFound()
	}

	const club = await getClubWithAlbums(Number(params.clubId))

	if (!club) {
		return notFound()
	}

	return (
		<div>
			<div>
				<Tabs defaultValue="schedule" className="w-full">
					<TabsList>
						<TabsTrigger value="schedule">Schedule</TabsTrigger>
						<TabsTrigger value="members">Members</TabsTrigger>
						<TabsTrigger value="general">General</TabsTrigger>
					</TabsList>
					<TabsContent value="schedule">
						<h2 className="text-xl font-bold">Schedule</h2>
						<FormRecordClubModifySchedule club={club} />
					</TabsContent>
					<TabsContent value="members">
						<h2 className="text-xl font-bold">Members</h2>
						<TableClubMembers club={club} />
					</TabsContent>
					<TabsContent value="general">
						<h2 className="text-xl font-bold">General Information</h2>
						{/* Add general information content here */}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
