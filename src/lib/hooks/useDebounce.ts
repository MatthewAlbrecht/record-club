import { useCallback, useRef } from "react"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number,
) {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	const debouncedFn = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}

			timeoutRef.current = setTimeout(() => {
				callback(...args)
			}, delay)
		},
		[callback, delay],
	)

	const cancel = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
		}
	}, [])

	return Object.assign(debouncedFn, { cancel })
}
