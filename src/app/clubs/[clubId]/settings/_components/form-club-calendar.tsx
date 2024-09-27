"use client";

import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useState } from "react";
import { cn } from "~/lib/utils";
import type { GetClubWithAlbums } from "~/server/api/queries";
import { SelectClubAlbum } from "~/server/db/schema";

const days = [
  { date: "2021-12-27", events: [] },
  { date: "2021-12-28", events: [] },
  { date: "2021-12-29", events: [] },
  { date: "2021-12-30", events: [] },
  { date: "2021-12-31", events: [] },
  { date: "2022-01-01", isCurrentMonth: true, events: [] },
  { date: "2022-01-02", isCurrentMonth: true, events: [] },
  {
    date: "2022-01-03",
    isCurrentMonth: true,
    events: [
      {
        id: 1,
        name: "Design review",
        time: "10AM",
        datetime: "2022-01-03T10:00",
        href: "#",
      },
      {
        id: 2,
        name: "Sales meeting",
        time: "2PM",
        datetime: "2022-01-03T14:00",
        href: "#",
      },
    ],
  },
  { date: "2022-01-04", isCurrentMonth: true, events: [] },
  { date: "2022-01-05", isCurrentMonth: true, events: [] },
  { date: "2022-01-06", isCurrentMonth: true, events: [] },
  {
    date: "2022-01-07",
    isCurrentMonth: true,
    events: [
      {
        id: 3,
        name: "Date night",
        time: "6PM",
        datetime: "2022-01-08T18:00",
        href: "#",
      },
    ],
  },
  { date: "2022-01-08", isCurrentMonth: true, events: [] },
  { date: "2022-01-09", isCurrentMonth: true, events: [] },
  { date: "2022-01-10", isCurrentMonth: true, events: [] },
  { date: "2022-01-11", isCurrentMonth: true, events: [] },
  {
    date: "2022-01-12",
    isCurrentMonth: true,
    isToday: true,
    events: [
      {
        id: 6,
        name: "Sam's birthday party",
        time: "2PM",
        datetime: "2022-01-25T14:00",
        href: "#",
      },
    ],
  },
  { date: "2022-01-13", isCurrentMonth: true, events: [] },
  { date: "2022-01-14", isCurrentMonth: true, events: [] },
  { date: "2022-01-15", isCurrentMonth: true, events: [] },
  { date: "2022-01-16", isCurrentMonth: true, events: [] },
  { date: "2022-01-17", isCurrentMonth: true, events: [] },
  { date: "2022-01-18", isCurrentMonth: true, events: [] },
  { date: "2022-01-19", isCurrentMonth: true, events: [] },
  { date: "2022-01-20", isCurrentMonth: true, events: [] },
  { date: "2022-01-21", isCurrentMonth: true, events: [] },
  {
    date: "2022-01-22",
    isCurrentMonth: true,
    isSelected: true,
    events: [
      {
        id: 4,
        name: "Maple syrup museum",
        time: "3PM",
        datetime: "2022-01-22T15:00",
        href: "#",
      },
      {
        id: 5,
        name: "Hockey game",
        time: "7PM",
        datetime: "2022-01-22T19:00",
        href: "#",
      },
    ],
  },
  { date: "2022-01-23", isCurrentMonth: true, events: [] },
  { date: "2022-01-24", isCurrentMonth: true, events: [] },
  { date: "2022-01-25", isCurrentMonth: true, events: [] },
  { date: "2022-01-26", isCurrentMonth: true, events: [] },
  { date: "2022-01-27", isCurrentMonth: true, events: [] },
  { date: "2022-01-28", isCurrentMonth: true, events: [] },
  { date: "2022-01-29", isCurrentMonth: true, events: [] },
  { date: "2022-01-30", isCurrentMonth: true, events: [] },
  { date: "2022-01-31", isCurrentMonth: true, events: [] },
  { date: "2022-02-01", events: [] },
  { date: "2022-02-02", events: [] },
  { date: "2022-02-03", events: [] },
  {
    date: "2022-02-04",
    events: [
      {
        id: 7,
        name: "Cinema with friends",
        time: "9PM",
        datetime: "2022-02-04T21:00",
        href: "#",
      },
    ],
  },
  { date: "2022-02-05", events: [] },
  { date: "2022-02-06", events: [] },
];
const selectedDay = days.find((day) => day.isSelected);

export default function FormClubCalendar({
  club,
}: {
  club: NonNullable<GetClubWithAlbums>;
}) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const currentMonthLabel = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  const [clubAlbums, setClubAlbums] = useState(club.clubAlbums);

  function handlePreviousMonth() {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  const dateToClubAlbm = clubAlbums.reduce(
    (acc, clubAlbum) => {
      if (!clubAlbum.scheduledFor) {
        return acc;
      }
      acc[clubAlbum.scheduledFor] = [
        ...(acc[clubAlbum.scheduledFor] || []),
        clubAlbum,
      ];
      return acc;
    },
    {} as Record<
      string,
      NonNullable<GetClubWithAlbums>["clubAlbums"][number][]
    >,
  );

  function getGridDays() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);

    // Find the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Find the first Monday (could be in the previous month)
    const firstMonday = new Date(firstDayOfMonth);
    firstMonday.setDate(
      firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7),
    );

    // Find the last Sunday (could be in the next month)
    const lastSunday = new Date(lastDayOfMonth);
    lastSunday.setDate(lastSunday.getDate() + ((7 - lastSunday.getDay()) % 7));

    const days: Array<Day> = [];

    // Loop from the first Monday to the last Sunday
    for (
      let day = new Date(firstMonday);
      day <= lastSunday;
      day.setDate(day.getDate() + 1)
    ) {
      days.push({
        // biome-ignore lint/style/noNonNullAssertion: day always exists and there will always be a zeroth element here
        date: day.toISOString().split("T")[0]!,
        fullDate: new Date(day.toISOString()),
        isCurrentMonth: day.getMonth() === month,
        isToday:
          day.toISOString().split("T")[0] === today.toISOString().split("T")[0],
        // biome-ignore lint/style/noNonNullAssertion: We know that the date is not null because we checked it above
        albums: dateToClubAlbm[day.toISOString().split("T")[0]!] || [],
        isSelected:
          day.toISOString().split("T")[0] ===
          selectedDate.toISOString().split("T")[0],
      });
    }

    return days;
  }

  const days = getGridDays();
  const selectedDay = days.find(
    (day) => day.date === selectedDate.toISOString().split("T")[0],
  );
  console.log("days", days);
  console.log("selectedDate", selectedDate);
  console.log("selectedDay", selectedDay);

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;

    if (over) {
      const date = over.id;
      const clubAlbumId = active.id;

      setClubAlbums((prev) =>
        prev.map((clubAlbum) => {
          if (clubAlbum.id === clubAlbumId) {
            return {
              ...clubAlbum,
              scheduledFor: String(date),
            };
          }
          return clubAlbum;
        }),
      );

      // If the item is dropped over a container, set it as the parent
      // otherwise reset the parent to `null`
      // hello

      console.log(over, event);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="lg:flex lg:h-full lg:flex-col">
        <header className="flex items-center justify-between border-b border-gray-200  py-4 lg:flex-none">
          {/* <h1 className="text-base font-semibold leading-6 text-gray-900">
						<time dateTime="2022-01">January 2022</time>
					</h1> */}
          <div className="relative flex rounded-md bg-white shadow-sm">
            <button
              type="button"
              className="flex h-9 items-center justify-center rounded-l-md border-y border-l border-gray-300 text-gray-400 hover:text-gray-500 focus:relative w-9 pr-0 hover:bg-gray-50"
              onClick={handlePreviousMonth}
            >
              <span className="sr-only">Previous month</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative block min-w-[143px]"
            >
              {currentMonthLabel}
            </button>

            <button
              type="button"
              className="flex h-9 items-center justify-center rounded-r-md border-y border-r border-gray-300 text-gray-400 hover:text-gray-500 focus:relative w-9 pl-0 md:hover:bg-gray-50"
              onClick={handleNextMonth}
            >
              <span className="sr-only">Next month</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex items-center">
            <div className="ml-4 flex items-center">
              <button
                type="button"
                className="ml-6 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add album
              </button>
            </div>
          </div>
        </header>
        <div className="shadow ring-1 ring-black ring-opacity-5 lg:flex lg:flex-auto lg:flex-col">
          <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700 lg:flex-none">
            <div className="bg-white py-2">
              M<span className="sr-only sm:not-sr-only">on</span>
            </div>
            <div className="bg-white py-2">
              T<span className="sr-only sm:not-sr-only">ue</span>
            </div>
            <div className="bg-white py-2">
              W<span className="sr-only sm:not-sr-only">ed</span>
            </div>
            <div className="bg-white py-2">
              T<span className="sr-only sm:not-sr-only">hu</span>
            </div>
            <div className="bg-white py-2">
              F<span className="sr-only sm:not-sr-only">ri</span>
            </div>
            <div className="bg-white py-2">
              S<span className="sr-only sm:not-sr-only">at</span>
            </div>
            <div className="bg-white py-2">
              S<span className="sr-only sm:not-sr-only">un</span>
            </div>
          </div>
          <div className="flex bg-gray-200 text-xs leading-6 text-gray-700 lg:flex-auto">
            <div className="hidden w-full lg:grid lg:grid-cols-7 lg:gap-px">
              {days.map((day) => (
                <DayDesktop key={day.date} day={day} />
              ))}
            </div>
            <div className="isolate grid w-full grid-cols-7 gap-px lg:hidden">
              {days.map((day) => (
                <DayMobile
                  key={day.date}
                  day={day}
                  setSelectedDate={setSelectedDate}
                />
              ))}
            </div>
          </div>
        </div>
        {selectedDay && selectedDay.albums.length > 0 && (
          <div className="px-4 py-10 sm:px-6 lg:hidden">
            <ol className="divide-y divide-gray-100 overflow-hidden rounded-lg bg-white text-sm shadow ring-1 ring-black ring-opacity-5">
              {selectedDay.albums.map((album) => (
                <li
                  key={album.id}
                  className="group flex p-4 pr-6 focus-within:bg-gray-50 hover:bg-gray-50"
                >
                  <div className="flex-auto">
                    <p className="font-semibold text-gray-900">
                      {album.album.title} by {album.album.artist}
                    </p>
                  </div>
                  <div className="ml-6 flex-none self-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 opacity-0 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400 focus:opacity-100 group-hover:opacity-100">
                    Edit
                    <span className="sr-only">
                      , {album.album.title} by {album.album.artist}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </DndContext>
  );
}
type ClubAlbum = NonNullable<GetClubWithAlbums>["clubAlbums"][number];

type Day = {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  albums: Array<ClubAlbum>;
  fullDate: Date;
};

function DayDesktop({ day }: { day: Day }) {
  const { isOver, setNodeRef } = useDroppable({
    id: day.date,
  });

  return (
    <div
      key={day.date}
      className={cn(
        day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-500",
        "relative px-3 py-2 border border-transparent",
        isOver && "border-indigo-500",
      )}
      ref={setNodeRef}
    >
      <time
        dateTime={day.date}
        className={
          day.isToday
            ? "flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white"
            : undefined
        }
      >
        {day.date?.split("-").pop()?.replace(/^0/, "")}
      </time>
      {day.albums.length > 0 && (
        <ol className="mt-2">
          {day.albums.map((clubAlbum) => (
            <AlbumListItem key={clubAlbum.id} clubAlbum={clubAlbum} />
          ))}
        </ol>
      )}
    </div>
  );
}

function AlbumListItem({ clubAlbum }: { clubAlbum: ClubAlbum }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: clubAlbum.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <li
      key={clubAlbum.id}
      className="relative z-10"
      style={style}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
    >
      <div className="group flex">
        <p className="flex-auto truncate font-medium text-gray-900 group-hover:text-indigo-600">
          {clubAlbum.album.title} by {clubAlbum.album.artist}
        </p>
      </div>
    </li>
  );
}

function DayMobile({
  day,
  setSelectedDate,
}: {
  day: Day;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
}) {
  function handleClick() {
    setSelectedDate(day.fullDate);
  }

  return (
    <button
      key={day.date}
      type="button"
      onClick={handleClick}
      className={cn(
        day.isCurrentMonth ? "bg-white" : "bg-gray-50",
        (day.isSelected || day.isToday) && "font-semibold",
        day.isSelected && "text-white",
        !day.isSelected && day.isToday && "text-indigo-600",
        !day.isSelected &&
          day.isCurrentMonth &&
          !day.isToday &&
          "text-gray-900",
        !day.isSelected &&
          !day.isCurrentMonth &&
          !day.isToday &&
          "text-gray-500",
        "flex h-14 flex-col px-3 py-2 hover:bg-gray-100 focus:z-10",
      )}
    >
      <time
        dateTime={day.date}
        className={cn(
          day.isSelected &&
            "flex h-6 w-6 items-center justify-center rounded-full",
          day.isSelected && day.isToday && "bg-indigo-600",
          day.isSelected && !day.isToday && "bg-gray-900",
          "ml-auto",
        )}
      >
        {day.date.split("-").pop()?.replace(/^0/, "") ?? ""}
      </time>
      <span className="sr-only">{day.albums.length} events</span>
      {day.albums.length > 0 && (
        <span className="-mx-0.5 mt-auto flex flex-wrap-reverse">
          {day.albums.map((album) => (
            <span
              key={album.id}
              className="mx-0.5 mb-1 h-1.5 w-1.5 rounded-full bg-gray-400"
            />
          ))}
        </span>
      )}
    </button>
  );
}

export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
