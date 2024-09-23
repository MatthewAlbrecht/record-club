import { db } from "~/server/db";
import { clubMembers } from "~/server/db/schema";
import { getAuthenticatedUser } from "~/server/api/queries";
import { CardClub } from "~/components/card-club";

export default async function DiscoverPage() {
  const user = await getAuthenticatedUser();

  const clubsImNotAMemberOf = await getClubsImNotAMemberOf(user.id);

  return clubsImNotAMemberOf.length > 0 ? (
    <div className="@container">
      <h3 className="mb-4 text-base font-semibold leading-6 text-slate-900">
        Popular clubs
      </h3>

      <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {clubsImNotAMemberOf.map((club) => (
          <CardClub key={club.id} club={club} />
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

function getClubsImNotAMemberOf(userId: number) {
  return db.query.clubs.findMany({
    where: (clubs, { not, inArray, eq }) =>
      not(
        inArray(
          clubs.id,
          db
            .select({ id: clubMembers.clubId })
            .from(clubMembers)
            .where(eq(clubMembers.userId, userId)),
        ),
      ),
    with: {
      image: true,
    },
  });
}
