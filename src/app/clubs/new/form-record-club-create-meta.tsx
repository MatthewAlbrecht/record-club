"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "~/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Textarea } from "~/components/ui/textarea"
import { createClub } from "~/server/api/clubs-actions"

export const createClubSchema = z.object({
	name: z.string().min(1),
	shortDescription: z.string().min(3),
	longDescription: z.string().min(3),
})

export type CreateClubForm = z.infer<typeof createClubSchema>

export function FormRecordClubCreateMeta() {
	const router = useRouter()
	const form = useForm({
		defaultValues: {
			name: "",
			shortDescription: "",
			longDescription: "",
		},
		resolver: zodResolver(createClubSchema),
	})

	const { execute } = useAction(createClub, {
		onSuccess({ data }) {
			if (!data) {
				return
			}
			toast.success(`${data.club.name} created successfully`)
			router.push(`/clubs/${data.club.id}/onboarding/schedule`)
		},
	})

	function onSubmit(data: CreateClubForm) {
		execute(data)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<h1 className="text-base font-semibold leading-7 text-slate-900">
					Create a record club
				</h1>
				<p className="mt-1 text-sm leading-6 text-slate-600">
					General information about the club
				</p>

				<div className="mt-10">
					<div className="space-y-8">
						<FormField
							name="name"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Club name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="shortDescription"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Short description</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="longDescription"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Long description</FormLabel>
									<FormControl>
										<Textarea {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<Separator className="my-12 border-slate-900/10" />

					<div className="flex items-center justify-end gap-x-6">
						<Button type="submit" variant="ghost" asChild>
							<Link href="/">Cancel</Link>
						</Button>
						<Button type="submit" className="">
							Save Club
						</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
