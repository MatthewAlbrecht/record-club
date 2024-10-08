import "~/styles/globals.css"

import { ClerkProvider } from "@clerk/nextjs"
import { GeistSans } from "geist/font/sans"
import type { Metadata } from "next"
import { Toaster } from "~/components/ui/sonner"
import { TooltipProvider } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import { Navbar } from "./navbar"
import { NavbarMobileFooter } from "./navbar-mobile-footer"
import { NavbarMobileHeader } from "./navbar-mobile-header"
import { ReactQueryProvider } from "./react-query-provider"

export const metadata: Metadata = {
	title: "Record Clubs",
	description: "Where music nerds congregate.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<ClerkProvider>
			<ReactQueryProvider>
				<TooltipProvider>
					<html lang="en" className={cn(`${GeistSans.variable}`, "h-full")}>
						<body className="bg-slate-100">
							<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
								<Navbar />
							</div>

							<NavbarMobileHeader />
							<NavbarMobileFooter />

							<main className="fixed inset-2 top-12 bottom-16 overflow-auto overflow-x-hidden rounded-lg bg-white p-main-inner shadow lg:top-2 lg:bottom-2 lg:left-72 lg:rounded-2xl">
								{children}
							</main>
							<Toaster />
						</body>
					</html>
				</TooltipProvider>
			</ReactQueryProvider>
		</ClerkProvider>
	)
}
