"use client";

import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import ReactCountryFlag from "react-country-flag";

const languages = [
  { code: "en", name: "English", countryCode: "GB" },
  { code: "ru", name: "Русский", countryCode: "RU" },
  { code: "uz", name: "O'zbek", countryCode: "UZ" },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [selectedLang, setSelectedLang] = useState("en");
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {languages.find((lang) => lang.code === selectedLang) && (
                <div className="flex items-center w-12 gap-2">
                  <ReactCountryFlag
                    countryCode={
                      languages.find((lang) => lang.code === selectedLang)
                        ?.countryCode || "EN"
                    }
                    svg
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <span className="text-sm font-medium">
                    {selectedLang.toUpperCase()}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
              >
                <div className="mr-2">
                  <ReactCountryFlag
                    countryCode={lang.countryCode}
                    svg
                    style={{
                      width: "1.5rem",
                      height: "1.5rem",
                      borderRadius: "0.375rem",
                    }}
                  />
                </div>
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild className="">
            <Button variant="ghost" size="icon" className="w-10">
              {theme === "dark" ? (
                <Moon className="size-6" suppressHydrationWarning />
              ) : (
                <Sun className="size-6" suppressHydrationWarning />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="mt-1">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 size-6" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 size-6" />
              Dark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="/placeholder.svg?height=32&width=32"
                  alt="User"
                />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
