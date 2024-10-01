import { CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
import { acceptInvite, rejectInvite } from "~/server/api/clubs-actions"
import type { GetOpenClubInvites } from "~/server/api/queries"
export function CardInvite({ invite }: { invite: GetOpenClubInvites[number] }) {
	return (
		<li key={invite.id} className="col-span-1 rounded-lg bg-white shadow-md">
			<div className="flex w-full items-center justify-between space-x-6 p-6">
				<div className="flex-1 truncate">
					<div className="flex items-center space-x-3">
						<h3 className="truncate font-medium text-slate-900 text-sm">
							{invite.club.name}
						</h3>
					</div>
					<p className="mt-1 truncate text-slate-500 text-sm">
						{invite.club.shortDescription}
					</p>
				</div>
				<div className="relative flex aspect-video w-24 items-center rounded-sm bg-slate-200">
					{invite.club.image?.url && (
						<Image
							alt=""
							src={invite.club.image?.url}
							fill
							className="flex-shrink-0 rounded-sm object-cover"
							style={{
								objectPosition: `${invite.club.image?.focalPointX}% ${invite.club.image?.focalPointY}%`,
							}}
						/>
					)}
				</div>
			</div>
			<div className="border-slate-200 border-t">
				<div className="flex">
					<form action={rejectInvite} className="flex w-0 flex-1">
						<button
							type="submit"
							className=" relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg bg-white py-4 font-semibold text-slate-900 text-sm hover:bg-slate-50"
						>
							<XCircle aria-hidden="true" className="h-5 w-5 text-slate-400" />
							Decline
						</button>
						<input type="hidden" name="clubInviteId" value={invite.id} />
					</form>
					<form
						className="flex w-0 flex-1 border-slate-200 border-l"
						action={acceptInvite}
					>
						<button
							type="submit"
							className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg bg-white py-4 font-semibold text-slate-900 text-sm hover:bg-slate-50"
						>
							<CheckCircle
								aria-hidden="true"
								className="h-5 w-5 text-slate-400"
							/>
							Join
						</button>
						<input type="hidden" name="clubInviteId" value={invite.id} />
					</form>
				</div>
			</div>
		</li>
	)
}
