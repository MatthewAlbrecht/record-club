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
				<DialogHeader className="flex flex-col items-start md:flex-row md:items-center gap-x-4 gap-y-4">
					<div className="inline-flex items-center justify-center p-1 w-fit bg-red-100 rounded-full border-red-50 border-4">
						<Icon className="w-6 h-6 text-red-600" />
					</div>
					<div className="relative top-3">
						<DialogTitle className="text-left top-3 ">{title}</DialogTitle>
						{description && (
							<DialogDescription className="mt-1.5 text-left">
								{description}
							</DialogDescription>
						)}
					</div>
				</DialogHeader>
				<DialogFooter className="flex justify-end gap-2 flex-col-reverse md:flex-row mt-6 md:mt-6">
					<Button {...secondaryAction}>{secondaryAction.text}</Button>
					<Button {...primaryAction}>{primaryAction.text}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
