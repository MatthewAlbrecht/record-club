"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CompassIcon, HomeIcon, SquareLibraryIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Discover", href: "/discover", icon: CompassIcon },
  { name: "Vault", href: "/vault", icon: SquareLibraryIcon },
];
const teams = [
  { id: 1, name: "Heroicons", href: "#", initial: "H", current: false },
  { id: 2, name: "Tailwind Labs", href: "#", initial: "T", current: false },
  { id: 3, name: "Workcation", href: "#", initial: "W", current: false },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="nav m-2 flex grow flex-col gap-y-5 overflow-y-auto rounded-2xl bg-white px-6 shadow">
      <div className="flex h-16 shrink-0 items-center">
        <img
          alt="Your Company"
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          className="h-8 w-auto"
        />
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? "bg-slate-50 text-indigo-600"
                        : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
                      "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={cn(
                        pathname === item.href
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-indigo-600",
                        "h-6 w-6 shrink-0",
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <div className="text-xs font-semibold leading-6 text-slate-400">
              Your clubs
            </div>
            <ul role="list" className="-mx-2 mt-2 space-y-1">
              {teams.map((team) => (
                <li key={team.name}>
                  <a
                    href={team.href}
                    className={cn(
                      team.current
                        ? "bg-slate-50 text-indigo-600"
                        : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
                      "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6",
                    )}
                  >
                    <span
                      className={cn(
                        team.current
                          ? "border-indigo-600 text-indigo-600"
                          : "border-slate-200 text-slate-400 group-hover:border-indigo-600 group-hover:text-indigo-600",
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium",
                      )}
                    >
                      {team.initial}
                    </span>
                    <span className="truncate">{team.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
          <li className="-mx-6 mt-auto">
            <UserLink />
          </li>
        </ul>
      </nav>
    </div>
  );
}

function UserLink() {
  const user = useUser();
  return (
    <>
      <SignedIn>
        <a
          href="#"
          className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-slate-900 hover:bg-slate-50"
        >
          <UserButton />
          <span className="sr-only">Your profile</span>
          <span aria-hidden="true">
            {user.user?.firstName} {user.user?.lastName}
          </span>
        </a>
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </>
  );
}
