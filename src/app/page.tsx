import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <div>
      <div>
        <SignedIn>
          <SignedInHome />
        </SignedIn>
        <SignedOut>
          <SignedOutHome />
        </SignedOut>
      </div>
    </div>
  );
}

async function SignedInHome() {
  return (
    <div className="flex">
      <Button asChild>
        <a href="/clubs/create">Create Club</a>
      </Button>
    </div>
  );
}

function SignedOutHome() {
  return <div>SignedOutHome</div>;
}
