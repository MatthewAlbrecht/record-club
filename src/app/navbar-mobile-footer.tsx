import {
  HomeIcon,
  CompassIcon,
  SquareLibraryIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: HomeIcon, current: true },
  { name: "Dsicover", href: "/discover", icon: CompassIcon, current: false },
  { name: "Vault", href: "/vault", icon: SquareLibraryIcon, current: false },
  {
    name: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    current: false,
  },
];

export function NavbarMobileFooter() {
  return (
    <div className="fixed inset-x-2 bottom-2 z-40 flex h-12 items-center justify-around rounded-lg bg-white/50 sm:px-2 lg:hidden">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            item.current
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-700",
            "flex flex-1 items-center justify-center",
          )}
        >
          <item.icon aria-hidden="true" className="h-6 w-6" />
        </Link>
      ))}
    </div>
  );
}
