import { PaletteIcon } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "~/lib/utils"
import { Button } from "./button"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export function ColorPicker({
	name,
	defaultValue,
}: { name: string; defaultValue?: string }) {
	const [color, setColor] = useState(defaultValue || "#ffffff")
	return (
		<div>
			<input type="hidden" name={name} value={color} />
			<Popover>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						className={cn(
							"flex w-full items-center justify-between gap-2",
							`text-${getContrastColor(color)}`,
							`hover:text-${getContrastColor(color)}`,
						)}
						style={{ backgroundColor: color }}
					>
						<span>Click to select color</span>
						<PaletteIcon className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent>
					<InputColorPicker
						name={name}
						defaultValue={defaultValue}
						color={color}
						setColor={setColor}
					/>
				</PopoverContent>
			</Popover>
		</div>
	)
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255

	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const d = max - min

	const h =
		max === min
			? 0
			: max === r
				? (g - b) / d + (g < b ? 6 : 0)
				: max === g
					? (b - r) / d + 2
					: (r - g) / d + 4
	const s = max === 0 ? 0 : d / max
	const v = max

	return { h: h * 60, s: s * 100, v: v * 100 }
}

export function InputColorPicker({
	name,
	color,
	setColor,
}: {
	name: string
	defaultValue?: string
	color: string
	setColor: (color: string) => void
}) {
	const defaults = hexToHsv(color)
	const [hue, setHue] = useState(defaults.h || 0)
	const [saturation, setSaturation] = useState(defaults.s || 0)
	const [vibrance, setVibrance] = useState(defaults.v || 100)
	const [isDragging, setIsDragging] = useState(false)
	const [isHueDragging, setIsHueDragging] = useState(false)
	const colorBoxRef = useRef<HTMLDivElement>(null)
	const hueSliderRef = useRef<HTMLDivElement>(null)

	const updateColor = useCallback((x: number, y: number) => {
		if (colorBoxRef.current) {
			const rect = colorBoxRef.current.getBoundingClientRect()
			const s = Math.max(0, Math.min(100, (x / rect.width) * 100))
			const v = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100))
			setSaturation(s)
			setVibrance(v)
		}
	}, [])

	const handleMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsDragging(true)
			updateColor(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
		},
		[updateColor],
	)

	const handleMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
			if (isDragging && colorBoxRef.current) {
				const rect = colorBoxRef.current.getBoundingClientRect()
				const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
				const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
				updateColor(x, y)
			}
		},
		[isDragging, updateColor],
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	const handleHueMouseDown = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			setIsHueDragging(true)
			handleHueChange(e)
		},
		[],
	)

	const handleHueMouseMove = useCallback(
		(e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
			if (isHueDragging && hueSliderRef.current) {
				handleHueChange(e)
			}
		},
		[isHueDragging],
	)

	const handleHueMouseUp = useCallback(() => {
		setIsHueDragging(false)
	}, [])

	const handleHueChange = useCallback(
		(e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
			if (hueSliderRef.current) {
				const rect = hueSliderRef.current.getBoundingClientRect()
				const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
				const newHue = Math.round((x / rect.width) * 360)
				setHue(newHue)
			}
		},
		[],
	)

	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove)
			document.addEventListener("mouseup", handleMouseUp)
		}
		return () => {
			document.removeEventListener("mousemove", handleMouseMove)
			document.removeEventListener("mouseup", handleMouseUp)
		}
	}, [isDragging, handleMouseMove, handleMouseUp])

	useEffect(() => {
		if (isHueDragging) {
			document.addEventListener("mousemove", handleHueMouseMove)
			document.addEventListener("mouseup", handleHueMouseUp)
		}
		return () => {
			document.removeEventListener("mousemove", handleHueMouseMove)
			document.removeEventListener("mouseup", handleHueMouseUp)
		}
	}, [isHueDragging, handleHueMouseMove, handleHueMouseUp])

	useEffect(() => {
		const hsvToHex = (h: number, s: number, v: number): string => {
			s /= 100
			v /= 100
			const c = v * s
			const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
			const m = v - c
			let r: number
			let g: number
			let b: number
			if (h >= 0 && h < 60) [r, g, b] = [c, x, 0]
			else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0]
			else if (h >= 120 && h < 180) [r, g, b] = [0, c, x]
			else if (h >= 180 && h < 240) [r, g, b] = [0, x, c]
			else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c]
			else [r, g, b] = [c, 0, x]
			const toHex = (n: number) =>
				Math.round((n + m) * 255)
					.toString(16)
					.padStart(2, "0")
			return `#${toHex(r)}${toHex(g)}${toHex(b)}`
		}
		const newColor = hsvToHex(hue, saturation, vibrance)
		setColor(newColor)
	}, [hue, saturation, vibrance, setColor])

	return (
		<div className="flex flex-col gap-4">
			<div
				ref={colorBoxRef}
				className="relative h-64 w-64 cursor-crosshair rounded-md"
				style={{
					background: `
						linear-gradient(to top, #000, transparent),
						linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
					`,
				}}
				onMouseDown={handleMouseDown}
			>
				<div
					className="pointer-events-none absolute h-4 w-4 rounded-full"
					style={{
						left: `${saturation}%`,
						top: `${100 - vibrance}%`,
						transform: "translate(-50%, -50%)",
						border: "2px solid white",
						boxShadow:
							"0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3)",
					}}
				/>
			</div>
			<div
				className="relative h-4 w-64 cursor-pointer"
				ref={hueSliderRef}
				onMouseDown={handleHueMouseDown}
			>
				<div
					className="absolute top-0 right-0 left-0 h-full rounded-sm"
					style={{
						background: `linear-gradient(to right, 
							#ff0000 0%, 
							#ffff00 17%, 
							#00ff00 33%, 
							#00ffff 50%, 
							#0000ff 67%, 
							#ff00ff 83%, 
							#ff0000 100%
						)`,
					}}
				/>
				<div
					className="pointer-events-none absolute top-0 h-full w-4"
					style={{
						left: `calc(${(hue / 360) * 100}% - 8px)`,
					}}
				>
					<div
						className="h-4 w-4 rounded-full"
						style={{
							border: "2px solid white",
							boxShadow:
								"0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.3)",
							backgroundColor: `hsl(${hue}, 100%, 50%)`,
						}}
					/>
				</div>
			</div>
			<input type="hidden" name={name} value={color} />
			<div
				className="flex items-center gap-2 rounded-md p-2"
				style={{ backgroundColor: color }}
			>
				<span className={cn(`text-${getContrastColor(color)}`, "font-bold")}>
					{color}
				</span>
			</div>
		</div>
	)
}

// Add this function at the top of the file, outside the component
function getContrastColor(hexColor: string): string {
	// Remove the # if it's there
	const hex = hexColor.replace("#", "")

	// Convert hex to RGB
	const r = Number.parseInt(hex.substring(0, 2), 16)
	const g = Number.parseInt(hex.substring(2, 4), 16)
	const b = Number.parseInt(hex.substring(4, 6), 16)

	// Calculate luminance
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

	// Return black for light colors, white for dark colors
	return luminance > 0.5 ? "slate-900" : "slate-50"
}
