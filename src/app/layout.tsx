import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./navbar";
import { Toaster } from "~/components/ui/sonner";
import { ReactQueryProvider } from "./react-query-provider";
import { cn } from "~/lib/utils";
import { NavbarMobileFooter } from "./navbar-mobile-footer";
import { NavbarMobileHeader } from "./navbar-mobile-header";

export const metadata: Metadata = {
  title: "Record Club",
  description: "A record club for the modern age.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <ReactQueryProvider>
        <html lang="en" className={cn(`${GeistSans.variable}`, "h-full")}>
          <body className="bg-slate-100">
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <Navbar />
            </div>

            <NavbarMobileHeader />
            <NavbarMobileFooter />

            <main className="fixed inset-2 bottom-16 top-12 overflow-auto overflow-x-hidden rounded-lg bg-white py-6 shadow lg:bottom-2 lg:left-72 lg:top-2 lg:rounded-2xl">
              <div className="space-y-3 px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
            <Toaster />
          </body>
        </html>
      </ReactQueryProvider>
    </ClerkProvider>
  );
}
