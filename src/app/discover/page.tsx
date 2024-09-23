import { auth } from "@clerk/nextjs/server";
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
      <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {clubsImNotAMemberOf.map((club) => (
          <Card
            key={club.id}
            className="flex flex-col justify-between overflow-hidden"
          >
            {club.image ? (
              <img
                src={club.image.url}
                alt={club.name}
                className="h-48 w-full object-cover"
                style={{
                  objectPosition: club.image.focalPoint ?? "center",
                }}
              />
            ) : (
              <div className="h-48 w-full bg-slate-100" />
            )}
            <CardHeader className="pt-3">
              <CardTitle className="mt-2 text-lg">{club.name}</CardTitle>
              <CardDescription>{club.shortDescription}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end">
              <Button variant="outline" asChild>
                <Link href={`/clubs/${club.id}`}>
                  <ArrowRight />
                </Link>
              </Button>
            </CardFooter>
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
