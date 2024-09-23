"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "~/lib/utils"
import type { SelectClub, SelectClubMember } from "~/server/db/schema"

export function NavbarClubListItem({
	membership,
}: {
	membership: SelectClubMember & { club: SelectClub }
}) {
	const pathname = usePathname()
	return (
		<li key={membership.id}>
			<Link
				href={`/clubs/${membership.club.id}`}
				className={cn(
					pathname === `/clubs/${membership.club.id}`
						? "bg-slate-50 text-indigo-600"
						: "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
					"group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
				)}
			>
				<span
					className={cn(
						pathname === `/clubs/${membership.club.id}`
							? "border-indigo-600 text-indigo-600"
							: "border-slate-200 text-slate-400 group-hover:border-indigo-600 group-hover:text-indigo-600",
						"flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium",
					)}
				>
					{membership.club.name
						.split(" ")
						.map((word) => word[0])
						.join("")
						.slice(0, 3)}
				</span>
				<span className="truncate">{membership.club.name}</span>
			</Link>
		</li>
	)
}
