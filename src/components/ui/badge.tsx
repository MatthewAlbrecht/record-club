import { type VariantProps, cva } from "class-variance-authority"
import type * as React from "react"

import { cn } from "~/lib/utils"

const badgeVariants = cva(
	"inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
				outline: "text-foreground",
				success:
					"border-transparent bg-green-600 text-primary-foreground hover:bg-green-600/80",
				purple:
					"border-transparent bg-purple-600 text-primary-foreground hover:bg-purple-600/80",
				warning:
					"border-transparent bg-yellow-600 text-primary-foreground hover:bg-yellow-600/80",
				primary:
					"border-transparent bg-indigo-600 text-primary-foreground hover:bg-indigo-600/80",
				orange:
					"border-transparent bg-orange-600 text-primary-foreground hover:bg-orange-600/80",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
