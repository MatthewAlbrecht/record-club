import { SelectClub, SelectImage } from "~/server/db/schema";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

import Image from "next/image";

export function CardClub({
  club,
}: {
  club: Pick<SelectClub, "id" | "name" | "shortDescription"> & {
    image:
      | (Pick<SelectImage, "url" | "focalPoint"> & {
          [key: string]: any;
        })
      | null;
    [key: string]: any;
  };
}) {
  return (
    <Card
      key={club.id}
      className="flex flex-col overflow-hidden bg-black shadow-lg @container"
    >
      {club.image ? (
        <div className="relative h-40 w-full">
          <Image
            src={club.image.url}
            alt={club.name}
            className="object-cover"
            fill
            style={{
              objectPosition: club.image.focalPoint ?? "center",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
        </div>
      ) : (
        <div className="h-48 w-full bg-slate-100" />
      )}
      <CardHeader className="p-4 pt-2 @xs:p-5 @xs:pt-3">
        <CardTitle className="mt-2 text-base text-slate-100">
          {club.name}
        </CardTitle>
        <CardDescription className="text-sm text-slate-300">
          {club.shortDescription}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
