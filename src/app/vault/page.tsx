import Link from "next/link"

export default function VaultPage() {
	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="font-bold text-2xl text-gray-700">
					This page is under construction.
				</h1>
				<p className="mt-4 text-gray-500">Please check back later.</p>
				<Link
					href="/"
					className="mt-6 inline-block rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				>
					Go back to Home
				</Link>
			</div>
		</div>
	)
}
