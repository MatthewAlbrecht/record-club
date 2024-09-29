import type { GetClubWithAlbums } from "~/server/api/queries"
import FormClubCalendar from "./calendar-scheduler/form-club-calendar"

export async function PageClubSettingsSchedule({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	return (
		<>
			<h2 className="my-8 font-bold text-xl">Schedule</h2>
			<FormClubCalendar club={club} />
		</>
	)
}
