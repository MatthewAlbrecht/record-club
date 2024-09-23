import { useCallback, useEffect, useState } from "react"

export function useDebouncedState<T>(initialValue: T, delay = 300) {
	const [value, setValue] = useState<T>(initialValue)
	const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedValue(value), delay)

		return () => {
			clearTimeout(timer)
		}
	}, [value, delay])

	const setDebouncedState = useCallback(
		(newValue: T | ((prevValue: T) => T)) => {
			setValue(newValue)
		},
		[],
	)

	return [debouncedValue, setDebouncedState] as const
}
