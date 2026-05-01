"use client";

import React, { useState } from "react";
import { HiMenuAlt3 } from "react-icons/hi";
import { FaUser, FaUserCircle } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "../AuthContext";
import { navSections } from "./nav-items";

export default function DashboardHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, session, memos, isUnreadContactSubmissions } = useAuth();
  const [open, setOpen] = useState(false);

  const hasUnreadMemos = memos.some(
    (memo) => !memo.readBy.some((user) => user.id === session?.id) && memo.author.id !== session?.id
  );

  const handleNavClick = (link: string) => {
    router.push(`/${link}`);
    setOpen(false);
  };

  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-16 bg-white border-b border-black/10 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-green-800">
              <HiMenuAlt3 className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-white p-0 flex flex-col">
            <SheetHeader className="p-6 border-b text-left">
              <SheetTitle className="text-xl font-bold text-green-800">
                The African Parent
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {navSections.map((section, sIndex) => (
                <div key={sIndex} className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2">{section.title}</div>
                  {section.items.map((item, index) => {
                    const isActive = pathname === `/${item.link}`;
                    return (
                      <button
                        key={index}
                        onClick={() => handleNavClick(item.link)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          isActive
                            ? "bg-green-50 text-green-800 font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm">{item.name}</span>
                        {(item.name === "Memos" && hasUnreadMemos) || (item.name === "Contact" && isUnreadContactSubmissions) ? (
                          <span className="ml-auto w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-bold text-green-800">TAP Admin</span>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {session ? (
                <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-green-50">
                  {session.name.charAt(0)}
                </div>
              ) : (
                <FaUserCircle className="w-8 h-8 text-gray-400" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-[200px] p-2 bg-white border border-gray-100 rounded-2xl">
              <Link
                href="/account"
                className="flex items-center tap-dark gap-2 p-3 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FaUser className="text-gray-400" />
                Profile Settings
              </Link>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 p-3 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors mt-1"
              >
                <BiLogOut size={18} />
                Sign Out
              </button>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
