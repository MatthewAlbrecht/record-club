"use client"
import { useAction } from "next-safe-action/hooks"
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
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import { useZodForm } from "~/lib/hooks/useZodForm"
import { modifyClubMeta } from "~/server/api/clubs-actions"
import type { GetClubWithAlbums } from "~/server/api/queries"

export const modifyClubMetaSchema = z.object({
	name: z.string().min(1),
	shortDescription: z.string().min(3),
	longDescription: z.string().min(3),
	isPublic: z.boolean(),
})

export type ModifyClubMetaForm = z.infer<typeof modifyClubMetaSchema>

export function FormRecordClubModifyMeta({
	club,
}: { club: NonNullable<GetClubWithAlbums> }) {
	const form = useZodForm({
		schema: modifyClubMetaSchema,
		defaultValues: {
			name: club.name,
			shortDescription: club.shortDescription,
			longDescription: club.longDescription,
			isPublic: club.isPublic,
		},
	})

	const { execute } = useAction(modifyClubMeta, {
		onSuccess({ data }) {
			if (!data) return
			toast.success("Club updated")
		},
		onError: ({ error }) => {
			toast.error(error.serverError ?? "Unable to update club")
		},
	})

	function onSubmit(data: ModifyClubMetaForm) {
		execute({ ...data, clubId: club.id })
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<h1 className="font-semibold text-base text-slate-900 leading-7">
					Modify club information
				</h1>
				<p className="mt-1 text-slate-600 text-sm leading-6">
					This is your club's chance to shine. Use this section to tell your
					members what your club is all about.
				</p>

				<div className="mt-10">
					<div className="space-y-8">
						<FormField
							name="isPublic"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Public club</FormLabel>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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

					<div className="mt-4 flex items-center justify-end gap-x-6">
						<Button type="submit">Save changes</Button>
					</div>
				</div>
			</form>
		</Form>
	)
}
