import { NavbarClubListItem } from "./navbar-club-list-item";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";

export async function NavbarClubList() {
  const { userId: clerkId } = auth();

  if (clerkId == null) {
    return <NavbarClubListEmpty />;
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkId, clerkId),
  });

  if (user == null) {
    return <NavbarClubListEmpty />;
  }

  const clubMemberships = await db.query.clubMembers.findMany({
    where: (clubMembers, { eq }) => eq(clubMembers.userId, user.id),
    with: {
      club: true,
    },
  });

  return (
    <ul role="list" className="-mx-2 mt-2 space-y-1">
      {clubMemberships.length === 0 ? (
        <NavbarClubListEmpty />
      ) : (
        clubMemberships.map((membership) => (
          <NavbarClubListItem key={membership.id} membership={membership} />
        ))
      )}
    </ul>
  );
}

function NavbarClubListEmpty() {
  return <div>No clubs</div>;
}
