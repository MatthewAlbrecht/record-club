"use client";

import { Button } from "~/components/ui/button";

import { TypeaheadAlbums } from "~/components/typeahead-albums";
import {
  SelectClub,
  SelectClubAlbum,
  type SelectAlbum,
} from "~/server/db/schema";
import { addAlbumToClub, deleteClubAlbum } from "~/server/api/clubs-actions";
import { useAction } from "next-safe-action/hooks";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { DatePicker } from "~/components/ui/day-picker";
import { z } from "zod";
import { useZodForm } from "~/lib/hooks/useZodForm";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";

const schema = z.object({
  date: z.date().optional(),
  album: z
    .object({
      id: z.number(),
      artist: z.string(),
      title: z.string(),
      createdAt: z.date(),
      releaseYear: z.number().nullable(),
      releaseMonth: z.number().nullable(),
      releaseDay: z.number().nullable(),
    })
    .optional(),
});

export function FormRecordClubCreateSchedule({
  clubAlbums,
  club,
}: {
  clubAlbums: (SelectClubAlbum & { album: SelectAlbum })[] | null;
  club: SelectClub;
}) {
  const router = useRouter();
  const form = useZodForm({
    schema,
    defaultValues: {
      date: new Date(),
    },
  });

  const { execute } = useAction(addAlbumToClub, {
    onSuccess({ data }) {
      toast.success(
        `${data?.clubAlbum.album.artist} - ${data?.clubAlbum.album.title} added`,
      );
      router.push(`/clubs/${club.id}/onboarding/questions`);
    },
    onError({ error }) {
      if (typeof error.serverError === "string") {
        toast.error(error.serverError);
      } else {
        toast.error("Unable to add album to club");
      }
    },
  });

  function onSubmit(data: z.infer<typeof schema>) {
    execute({
      clubId: club.id,
      albumId: data.album?.id!,
      scheduledFor: format(data.date!, "yyyy-MM-dd"),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-lg">
        <h1 className="text-base font-semibold leading-7 text-slate-900">
          Schedule your first album
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Select a date and album to put on the schedule.
        </p>

        <div className="mt-10 space-y-8">
          <FormField
            name="date"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled For</FormLabel>
                <FormControl>
                  <DatePicker
                    triggerLabel={
                      field.value
                        ? format(field.value, "MMM d, yyyy")
                        : "Select a date"
                    }
                    value={field.value}
                    onSelect={field.onChange}
                    calendarProps={{
                      disabled: [
                        { before: new Date() },
                        ...(clubAlbums
                          ?.filter((clubAlbum) => clubAlbum.scheduledFor)
                          .map((clubAlbum) =>
                            parseISO(clubAlbum.scheduledFor!),
                          ) ?? []),
                      ],
                      modifiers: {
                        booked:
                          clubAlbums
                            ?.filter((clubAlbum) => clubAlbum.scheduledFor)
                            .map((clubAlbum) =>
                              parseISO(clubAlbum.scheduledFor!),
                            ) ?? [],
                      },
                      modifiersClassNames: {
                        booked: "bg-slate-200 text-slate-800 opacity-50",
                      },
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="album"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Album</FormLabel>
                <FormControl>
                  <TypeaheadAlbums
                    selected={field.value}
                    setSelected={(value) => {
                      console.log("value", value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-12 border-slate-900/10" />

        <div className="flex justify-end gap-x-6">
          <Button variant="ghost">Skip</Button>
          <Button
            type="submit"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
          >
            Add album
          </Button>
        </div>
      </form>
    </Form>
  );
}