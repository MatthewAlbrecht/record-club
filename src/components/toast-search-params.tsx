"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ToastSearchParamsConfig {
	[key: string]: {
		message: string
		variant: "success" | "error" | "info" | "warning"
	}
}

export function ToastSearchParams({
	toastMap,
}: {
	toastMap: ToastSearchParamsConfig
}) {
	const [isClient, setIsClient] = useState(false)
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	useEffect(() => {
		setIsClient(true)
	}, [])

	useEffect(() => {
		if (!isClient) return

		console.log("===HELLO===", "toast-search-params")

		const newSearchParams = new URLSearchParams(searchParams.toString())
		let hasUpdated = false

		for (const [key, { message, variant }] of Object.entries(toastMap)) {
			if (newSearchParams.has(key)) {
				toast[variant](message)
				newSearchParams.delete(key)
				hasUpdated = true
			}
		}

		if (hasUpdated) {
			const newUrl = newSearchParams.toString()
				? `${pathname}?${newSearchParams.toString()}`
				: pathname
			router.replace(newUrl, { scroll: false })
		}
	}, [isClient, searchParams, toastMap, router, pathname])

	return null
}
