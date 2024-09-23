import { SignedIn, UserButton, SignedOut, SignInButton } from "@clerk/nextjs";
import { Disc3Icon } from "lucide-react";

export function NavbarMobileHeader() {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-2 py-2 sm:px-2 lg:hidden">
      <button type="button" className="mr-2 text-slate-600 lg:hidden">
        <span className="sr-only">Open sidebar</span>
        <Disc3Icon aria-hidden="true" className="h-8 w-8" />
      </button>
      <div className="flex-1 text-sm font-semibold leading-6 text-slate-600">
        RecordClubs
      </div>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </div>
  );
}