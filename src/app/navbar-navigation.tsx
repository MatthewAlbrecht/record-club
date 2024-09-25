"use client"

import { CompassIcon, HomeIcon, SquareLibraryIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "~/lib/utils"

export function NavbarNavigation() {
	const pathname = usePathname()

	return (
		<ul className="-mx-2 space-y-1">
			{navigation.map((item) => (
				<li key={item.name}>
					<Link
						href={item.href}
						className={cn(
							pathname === item.href
								? "bg-slate-50 text-indigo-600"
								: "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
							"group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
						)}
					>
						<item.icon
							aria-hidden="true"
							className={cn(
								pathname === item.href
									? "text-indigo-600"
									: "text-slate-400 group-hover:text-indigo-600",
								"h-6 w-6 shrink-0",
							)}
						/>
						{item.name}
					</Link>
				</li>
			))}
		</ul>
	)
}

const navigation = [
	{ name: "Home", href: "/", icon: HomeIcon },
	{ name: "Discover", href: "/discover", icon: CompassIcon },
	{ name: "Vault", href: "/vault", icon: SquareLibraryIcon },
]
