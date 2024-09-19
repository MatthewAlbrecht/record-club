"use client";

import { ClubWithAlbums } from "../_queries";
import { Calendar } from "~/components/ui/calendar";
import { useState } from "react";
import { SelectAlbum } from "~/server/db/schema";
import { format, isAfter, parseISO } from "date-fns";
import { TypeaheadAlbums } from "~/components/typeahead-albums";
import { useAction } from "next-safe-action/hooks";
import { deleteClubAlbum } from "~/server/api/clubs-actions";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { Input } from "~/components/ui/input";

export function FormRecordClubModifySchedule({
  club,
}: {
  club: ClubWithAlbums;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedAlbum, setSelectedAlbum] = useState<SelectAlbum>();

  const {
    execute: deleteAlbum,
    input: deleteInput,
    isExecuting: isDeleting,
  } = useAction(deleteClubAlbum, {
    onSuccess() {
      toast.success("Album deleted");
    },
    onError({ error }) {
      toast.error("Unable to delete album");
    },
  });

  const today = new Date();

  const upcomingClubAlbums = club?.clubAlbums.filter(
    (clubAlbum) =>
      clubAlbum.scheduledFor &&
      isAfter(parseISO(clubAlbum.scheduledFor), today),
  );

  return (
    <div className="flex gap-4">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={[
            { before: new Date() },
            ...(upcomingClubAlbums
              ?.filter((clubAlbum) => clubAlbum.scheduledFor)
              .map((clubAlbum) => parseISO(clubAlbum.scheduledFor!)) ?? []),
          ]}
          modifiers={{
            booked:
              upcomingClubAlbums
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
      </div>
      <div className="w-full">
        {upcomingClubAlbums && upcomingClubAlbums.length > 0 ? (
          <ul className="space-y-2 divide-y-[1px] divide-gray-100">
            {upcomingClubAlbums.map((clubAlbum) => (
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
                  <span className="font-medium">{clubAlbum.album.artist}</span>
                  <span className="italic text-gray-800">
                    {clubAlbum.album.title}
                  </span>
                </span>
                {clubAlbum.scheduledFor && (
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
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No albums scheduled yet.</p>
        )}
      </div>
    </div>
  );
}
