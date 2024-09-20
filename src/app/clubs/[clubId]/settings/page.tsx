import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "~/server/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { FormRecordClubModifySchedule } from "./_components/form-record-club-modify-schedule";
import { getClubWithAlbums } from "./_queries";

export default async function ClubSettingsPage({
  params,
}: {
  params: { clubId: string };
}) {
  const { userId } = auth().protect();
  const membership = await db.query.clubMembers.findFirst({
    where: (clubMembers, { eq, and }) =>
      and(
        eq(clubMembers.clubId, Number(params.clubId)),
        eq(clubMembers.clerkUserId, userId),
        eq(clubMembers.isActive, true),
      ),
  });

  const isAdminOrOwner =
    membership?.role === "owner" || membership?.role === "admin";
  if (!isAdminOrOwner) {
    return notFound();
  }

  const club = await getClubWithAlbums(Number(params.clubId));

  if (!club) {
    return notFound();
  }

  return (
    <div>
      <div>
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule">
            <h2 className="text-xl font-bold">Schedule</h2>
            <FormRecordClubModifySchedule club={club} />
          </TabsContent>
          <TabsContent value="members">
            <h2 className="text-xl font-bold">Members</h2>
            {/* Add members content here */}
          </TabsContent>
          <TabsContent value="general">
            <h2 className="text-xl font-bold">General Information</h2>
            {/* Add general information content here */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
