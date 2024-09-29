import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { DataTable } from "~/components/ui/data-table"
import {
	type GetClubMembers,
	type GetClubWithAlbums,
	getClubMembers,
} from "~/server/api/queries"
import { columns } from "./columns-table-club-members"

export async function TableClubMembers({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	const { userId } = auth()
	const clubMembers = await getClubMembers(club.id)

	const currentMember = clubMembers.find((member) => member.userId === userId)

	if (!currentMember) {
		return notFound()
	}

	return (
		<>
			<DataTable<GetClubMembers[number], unknown>
				columns={columns}
				data={clubMembers}
				withPagination
				withSorting
				meta={{
					currentMember,
				}}
			/>
		</>
	)
}
