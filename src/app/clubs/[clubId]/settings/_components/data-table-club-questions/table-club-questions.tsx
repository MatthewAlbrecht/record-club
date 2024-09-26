import type { GetAllQuestions, GetClubWithAlbums } from "~/server/api/queries"
import { columns } from "./columns-table-club-questions"
import { DataTable } from "~/components/ui/data-table"

export function TableClubQuestions({
	questions,
	club,
}: {
	questions: GetAllQuestions
	club: NonNullable<GetClubWithAlbums>
}) {
	return (
		<DataTable<GetAllQuestions[number], unknown>
			columns={columns}
			data={questions}
			withPagination
			withSorting
			meta={{
				clubId: club.id,
			}}
		/>
	)
}
