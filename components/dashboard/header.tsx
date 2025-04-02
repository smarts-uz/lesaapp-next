"use client";

import React from "react";
import { useState, useEffect } from "react";
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
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />

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
              {t("theme.light", "Light")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 size-6" />
              {t("theme.dark", "Dark")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="/placeholder.svg?height=32&width=32"
                  alt={t("user", "User")}
                />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t("adminUser", "Admin User")}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>{t("profile", "Profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{t("logout", "Log out")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
