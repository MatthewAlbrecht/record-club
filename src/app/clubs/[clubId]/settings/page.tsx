import { redirect } from "next/navigation"
import { Routes } from "~/lib/routes"

export default async function ClubSettingsPage({
	params,
}: {
	params: { clubId: string }
}) {
	return redirect(Routes.ClubSettings(params.clubId, "schedule"))
}
