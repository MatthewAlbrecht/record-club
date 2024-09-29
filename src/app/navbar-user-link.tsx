"use client"

import {
	SignInButton,
	SignedIn,
	SignedOut,
	UserButton,
	useUser,
} from "@clerk/nextjs"

export function UserLink() {
	const user = useUser()
	return (
		<>
			<SignedIn>
				<div className="flex cursor-pointer items-center gap-x-4 px-6 py-3 font-semibold text-slate-900 text-sm leading-6 hover:bg-slate-50">
					<UserButton />
					<span className="sr-only">Your profile</span>
					<span aria-hidden="true">
						{user.user?.firstName} {user.user?.lastName}
					</span>
				</div>
			</SignedIn>
			<SignedOut>
				<div className="flex cursor-pointer items-center gap-x-4 px-6 py-3 font-semibold text-slate-900 text-sm leading-6 hover:bg-slate-50">
					<SignInButton />
				</div>
			</SignedOut>
		</>
	)
}
