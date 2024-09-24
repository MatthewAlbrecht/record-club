import { CompassIcon, HomeIcon, SquareLibraryIcon } from "lucide-react"

import { NavbarClubList } from "./navbar-club-list"
import { NavbarNavigation } from "./navbar-navigation"
import { UserLink } from "./navbar-user-link"

export async function Navbar() {
	return (
		<div className="nav m-2 flex grow flex-col gap-y-5 overflow-y-auto rounded-2xl bg-white px-6 shadow">
			<div className="flex h-16 shrink-0 items-center">
				<img
					alt="Your Company"
					src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
					className="h-8 w-auto"
				/>
			</div>
			<nav className="flex flex-1 flex-col">
				<ul className="flex flex-1 flex-col gap-y-7">
					<li>
						<NavbarNavigation />
					</li>
					<li>
						<div className="text-xs font-semibold leading-6 text-slate-400">
							Your clubs
						</div>
						<ul className="flex flex-1 flex-col gap-y-7">
							<NavbarClubList />
						</ul>
					</li>
					<li className="-mx-6 mt-auto">
						<UserLink />
					</li>
				</ul>
			</nav>
		</div>
	)
}
