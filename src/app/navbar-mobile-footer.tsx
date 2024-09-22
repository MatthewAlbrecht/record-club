"use client";

import {
  HomeIcon,
  CompassIcon,
  SquareLibraryIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon },
  { name: "Discover", href: "/discover", icon: CompassIcon },
  { name: "Vault", href: "/vault", icon: SquareLibraryIcon },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function NavbarMobileFooter() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-2 bottom-2 z-40 flex h-12 items-center justify-around rounded-lg bg-white/50 sm:px-2 lg:hidden">
      {navigation.map((item) => {
        const isCurrent = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              isCurrent
                ? "text-indigo-600"
                : "text-slate-500 hover:text-slate-700",
              "flex flex-1 items-center justify-center",
            )}
          >
            <item.icon aria-hidden="true" className="h-6 w-6" />
          </Link>
        );
      })}
    </div>
  );
}
