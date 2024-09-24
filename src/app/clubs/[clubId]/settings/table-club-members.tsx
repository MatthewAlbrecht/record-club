import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table"
import { getClubMembers } from "~/server/api/queries"
import type { SelectClub, SelectClubMember } from "~/server/db/schema"

export async function TableClubMembers({ club }: { club: SelectClub }) {
	const clubMembers = await getClubMembers(club.id)

	return (
		<div className="border border-slate-200 rounded-md">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Role</TableHead>
						<TableHead className="w-24">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{clubMembers.map((clubMember) => (
						<TableRow key={clubMember.id} className="py-2">
							<TableCell className="py-2">
								<Button variant="link" asChild className="p-0 text-indigo-500">
									<Link href={`/users/${clubMember.user.username}`}>
										@{clubMember.user.username}
									</Link>
								</Button>
							</TableCell>
							<TableCell className="py-2">{clubMember.role}</TableCell>
							<TableCell className="py-2">
								<Button variant="outline">Remove</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

const columns: ColumnDef<SelectClubMember>[] = [
	{
		header: "Name",
		accessorKey: "name",
	},
	{
		header: "Role",
		accessorKey: "role",
	},
	{
		header: "",
		accessorKey: "actions",
	},
]
