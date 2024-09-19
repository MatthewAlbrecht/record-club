"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TypeaheadAlbums } from "~/components/typeahead-albums";
import { SelectClubAlbum, type SelectAlbum } from "~/server/db/schema";
import { addAlbumToClub, deleteClubAlbum } from "~/server/api/clubs-actions";
import { useAction } from "next-safe-action/hooks";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseAsInteger, useQueryState } from "nuqs";
import { format, parseISO } from "date-fns";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function FormRecordClubCreateSchedule({
  clubAlbums,
  clubId,
}: {
  clubAlbums: (SelectClubAlbum & { album: SelectAlbum })[] | null;
  clubId: number;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedAlbum, setSelectedAlbum] = useState<SelectAlbum>();
  const router = useRouter();
  const { execute } = useAction(addAlbumToClub, {
    onSuccess() {
      setSelectedDate(undefined);
      setSelectedAlbum(undefined);
    },
    onError({ error }) {
      if (typeof error.serverError === "string") {
        toast.error(error.serverError);
      } else {
        toast.error("Unable to add album to club");
      }
    },
  });

  const {
    execute: deleteAlbum,
    input: deleteInput,
    isExecuting: isDeleting,
  } = useAction(deleteClubAlbum, {
    onSuccess() {
      toast.success("Album deleted");
    },
    onError() {
      toast.error("Unable to delete album");
    },
  });

  function handleSelect(date?: Date) {
    setSelectedDate(date);
  }

  return (
    <form
      action={() => {
        void execute({
          clubId: clubId,
          albumId: selectedAlbum?.id!,
          scheduledFor: format(selectedDate!, "yyyy-MM-dd"),
        });
      }}
    >
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Add albums to the schedule</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={[
              { before: new Date() },
              ...(clubAlbums
                ?.filter((clubAlbum) => clubAlbum.scheduledFor)
                .map((clubAlbum) => parseISO(clubAlbum.scheduledFor!)) ?? []),
            ]}
            modifiers={{
              booked:
                clubAlbums
                  ?.filter((clubAlbum) => clubAlbum.scheduledFor)
                  .map((clubAlbum) => parseISO(clubAlbum.scheduledFor!)) ?? [],
            }}
            modifiersClassNames={{
              booked: "bg-gray-200 text-gray-800 opacity-50",
            }}
          />

          <div className="space-y-2">
            <TypeaheadAlbums
              selected={selectedAlbum}
              setSelected={setSelectedAlbum}
            />
          </div>
          <div className="w-full">
            <h3 className="mb-2 text-lg font-medium">Scheduled Albums</h3>
            {clubAlbums && clubAlbums.length > 0 ? (
              <ul className="space-y-2 divide-y-[1px] divide-gray-100">
                {clubAlbums.map((clubAlbum) => (
                  <li
                    key={clubAlbum.id}
                    className={`flex items-start justify-between gap-3 py-2 ${isDeleting && deleteInput.clubAlbumId === clubAlbum.id ? "opacity-50" : ""}`}
                  >
                    <span className="relative top-1 text-sm text-gray-500">
                      {clubAlbum.scheduledFor
                        ? format(parseISO(clubAlbum.scheduledFor), "M/d")
                        : "Not scheduled"}
                    </span>
                    <span className="flex flex-1 flex-col text-lg">
                      <span className="font-medium">
                        {clubAlbum.album.artist}
                      </span>
                      <span className="italic text-gray-800">
                        {clubAlbum.album.title}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void deleteAlbum({
                          clubAlbumId: clubAlbum.id,
                        });
                      }}
                      className="ml-2 self-center text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No albums scheduled yet.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            type="button"
            onClick={() => router.push(`/clubs/new?step=3&clubId=${clubId}`)}
          >
            Next step
          </Button>
          <Button type="submit" disabled={!selectedAlbum || !selectedDate}>
            Add album
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

type ClubAlbumsQueryVariables = {
  clubId: number;
};

function useClubAlbumsQuery(
  { clubId }: ClubAlbumsQueryVariables,
  options?: Omit<
    UseQueryOptions<{ albums: SelectAlbum[] }>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["clubAlbums", clubId],
    queryFn: () => {
      return fetch(`/api/clubs/${clubId}/albums`).then((res) => res.json());
    },
    ...options,
  });
}
