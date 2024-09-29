import { Button, type ButtonProps } from "./button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog"

import { InfoIcon } from "lucide-react"

interface ActionProps extends ButtonProps {
	text: string
}

export function DialogConfirmation({
	open,
	onOpenChange,
	title,
	description,
	primaryAction,
	secondaryAction,
	Icon = InfoIcon,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	primaryAction: ActionProps
	secondaryAction: ActionProps
	Icon: React.ElementType
	children?: React.ReactNode
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{children && <DialogTrigger asChild>{children}</DialogTrigger>}
			<DialogContent>
				<DialogHeader className="flex flex-col items-start gap-x-4 gap-y-4 md:flex-row md:items-center">
					<div className="inline-flex w-fit items-center justify-center rounded-full border-4 border-red-50 bg-red-100 p-1">
						<Icon className="h-6 w-6 text-red-600" />
					</div>
					<div className="relative top-3">
						<DialogTitle className="top-3 text-left ">{title}</DialogTitle>
						{description && (
							<DialogDescription className="mt-1.5 text-left">
								{description}
							</DialogDescription>
						)}
					</div>
				</DialogHeader>
				<DialogFooter className="mt-6 flex flex-col-reverse justify-end gap-2 md:mt-6 md:flex-row">
					<Button {...secondaryAction}>{secondaryAction.text}</Button>
					<Button {...primaryAction}>{primaryAction.text}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
