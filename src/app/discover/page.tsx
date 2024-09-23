import { db } from "~/server/db";
import { clubMembers } from "~/server/db/schema";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAuthenticatedUser } from "~/server/api/queries";
import Image from "next/image";

export default async function DiscoverPage() {
  const user = await getAuthenticatedUser();

  const clubsImNotAMemberOf = await db.query.clubs.findMany({
    where: (clubs, { not, inArray, eq }) =>
      not(
        inArray(
          clubs.id,
          db
            .select({ id: clubMembers.clubId })
            .from(clubMembers)
            .where(eq(clubMembers.userId, user.id)),
        ),
      ),
    with: {
      image: true,
    },
  });

  return clubsImNotAMemberOf.length > 0 ? (
    <div className="@container">
      <h3 className="mb-6 text-base font-semibold leading-6 text-slate-900">
        Popular clubs
      </h3>

      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {clubsImNotAMemberOf.map((club) => (
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
        ))}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center pt-16">
      <p className="text-center text-lg text-slate-500">
        No clubs to show, sorry!
      </p>
    </div>
  );
}
