import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { clubMembers } from "~/server/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DiscoverPage() {
  const { userId } = auth().protect();

  const clubsImNotAMemberOf = await db.query.clubs.findMany({
    where: (clubs, { not, inArray, eq }) =>
      not(
        inArray(
          clubs.id,
          db
            .select({ id: clubMembers.clubId })
            .from(clubMembers)
            .where(eq(clubMembers.clerkUserId, userId)),
        ),
      ),
  });

  console.log("clubsImNotAMemberOf", clubsImNotAMemberOf);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clubsImNotAMemberOf.map((club) => (
        <Card key={club.id} className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>{club.name}</CardTitle>
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
  );
}
