import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./_components/navbar";
import { Toaster } from "~/components/ui/sonner";

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
      <html lang="en" className={`${GeistSans.variable}`}>
        <body>
          <Navbar />
          <main className="px-6 pt-3">{children}</main>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
