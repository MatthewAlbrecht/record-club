import type { GetClubWithAlbums } from "~/server/api/queries"
import { TableClubInvites } from "./data-table-club-invites/table-club-invites"
import { TableClubMembers } from "./data-table-club-members/table-club-members"
import { HeaderClubSettingsMembers } from "./header-club-settings-members"

export function PageClubSettingsMembers({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	return (
		<div className="my-8">
			<HeaderClubSettingsMembers club={club} />
			<div className="flex flex-col gap-16">
				<div>
					<TableClubMembers club={club} />
				</div>
				<div>
					<TableClubInvites club={club} />
				</div>
			</div>
		</div>
	)
}
