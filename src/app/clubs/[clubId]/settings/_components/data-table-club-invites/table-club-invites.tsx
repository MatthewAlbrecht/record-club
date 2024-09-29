import { DataTable } from "~/components/ui/data-table"
import {
	type GetClubInvites,
	type GetClubWithAlbums,
	getClubInvites,
} from "~/server/api/queries"
import { columns } from "./columns-table-club-invites"

export async function TableClubInvites({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	const clubInvites = await getClubInvites(club.id)

	return (
		<>
			<h2 className="mb-8 font-bold text-xl">Club invites</h2>
			<DataTable<GetClubInvites[number], unknown>
				columns={columns}
				data={clubInvites}
				withPagination
				withSorting
			/>
		</>
	)
}
