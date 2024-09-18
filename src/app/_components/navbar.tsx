"use client";
import { useState } from "react";
import { Menu, X, Disc, Users, Archive } from "lucide-react";
import { Button } from "~/components/ui/button";
import { NavbarAuthentication } from "./navbar-authentication";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <a href="/" className="flex flex-shrink-0 items-center">
              <Disc className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">
                Record Club
              </span>
            </a>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Button asChild variant="ghost">
                  <a href="/discover">Discover</a>
                </Button>
                <Button asChild variant="ghost">
                  <a href="/clubs">Clubs</a>
                </Button>
                <Button asChild variant="ghost">
                  <a href="/vault">Vault</a>
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <NavbarAuthentication />
          </div>
          <div className="-mr-2 flex md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Button asChild variant="ghost">
              <a href="/discover">
                <Disc className="mr-2 inline-block h-5 w-5" />
                Discover
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href="/clubs">
                <Users className="mr-2 inline-block h-5 w-5" />
                Clubs
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href="/vault">
                <Archive className="mr-2 inline-block h-5 w-5" />
                Vault
              </a>
            </Button>
          </div>
          <div className="border-t border-gray-700 pb-3 pt-4">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <NavbarAuthentication />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
