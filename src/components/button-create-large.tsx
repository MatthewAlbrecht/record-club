import { LibraryIcon } from "lucide-react"

export function ButtonCreateLarge({ label }: { label: string }) {
	return (
		<div className="relative block w-full rounded-lg border-2 border-slate-300 border-dashed p-12 text-center hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
			<LibraryIcon className="mx-auto h-12 w-12 stroke-1 text-slate-400" />
			<span className="mt-2 block font-semibold text-slate-900 text-sm">
				{label}
			</span>
		</div>
	)
}
