"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { createClub } from "~/server/api/clubs-actions";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { useRouter } from "next/navigation";
import { Separator } from "~/components/ui/separator";
import Link from "next/link";

export const createClubSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().min(3),
  longDescription: z.string().min(3),
});

export type CreateClubForm = z.infer<typeof createClubSchema>;

export function FormRecordClubCreateMeta() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      name: "",
      shortDescription: "",
      longDescription: "",
    },
    resolver: zodResolver(createClubSchema),
  });

  const { execute } = useAction(createClub, {
    onSuccess({ data }) {
      if (!data) {
        return;
      }
      toast.success(`${data.club.name} created successfully`);
      router.push(`/clubs/${data.club.id}/onboarding/schedule`);
    },
  });

  function onSubmit(data: CreateClubForm) {
    execute(data);
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
                  <FormLabel>Club Name</FormLabel>
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
                  <FormLabel>Short Description</FormLabel>
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
                  <FormLabel>Long Description</FormLabel>
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
              Add Club
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
