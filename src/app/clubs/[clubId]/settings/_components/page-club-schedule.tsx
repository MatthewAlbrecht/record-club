import type { GetClubWithAlbums } from "~/server/api/queries"
import FormClubCalendar from "./form-club-calendar"

export async function PageClubSettingsSchedule({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	return (
		<>
			<h2 className="text-xl font-bold my-8">Schedule</h2>
			<FormClubCalendar club={club} />
			{/* <FormClubModifySchedule club={club} /> */}
		</>
	)
}
