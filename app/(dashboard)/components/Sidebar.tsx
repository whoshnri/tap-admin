"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaUser, FaUserCircle } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../AuthContext";
import Link from "next/link";
import { Admins } from "@/app/generated/prisma/client";
import { navSections } from "./nav-items";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, session, loadMemos, loadNotifications, memos, loadContactFormSubmissions, isUnreadContactSubmissions } = useAuth();
  const [showNewMemoBadge, setShowNewMemoBadge] = useState(false);
  const [hasUnreadContactSubmissions, setHasUnreadContactSubmissions] = useState(false);

  useEffect(() => {
    if (session) {
      loadMemos(session as Admins);
      loadNotifications(session as Admins);
      loadContactFormSubmissions(session as Admins);

      const hasUnread = memos.some(
        (memo) => !memo.readBy.some((user) => user.id === session?.id) && memo.author.id !== session?.id
      );
      setHasUnreadContactSubmissions(isUnreadContactSubmissions);

      setShowNewMemoBadge(hasUnread);
    }
  }, [session, memos, loadMemos, loadNotifications, loadContactFormSubmissions, isUnreadContactSubmissions]);

  const handleNavClick = (link: string) => {
    router.push(`/${link}`);
  };

  return (
    <div className="hidden md:flex w-[260px] h-full self-stretch border-r border-black/5 p-4 flex-col gap-4 overflow-y-auto bg-white">
      <div className="px-2">
        <h1 className="text-2xl font-black text-green-800">
          TAP CMS
        </h1>
      </div>

      <div className="flex flex-col gap-1.5 h-full">
        <div className="flex-1 space-y-4">
          {navSections.map((section, sIndex) => (
            <div key={sIndex} className="space-y-1">
              <div className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2">{section.title}</div>
              {section.items.map((item, index) => {
                const isActive = pathname === `/${item.link}`;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavClick(item.link)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors group ${
                      isActive
                      ? "bg-green-500/20 text-green-800 font-bold "
                      : "text-gray-500 hover:bg-gray-50 hover:text-green-800"
                    }`}
                  >
                    <div className={`text-xl transition-colors ${isActive ? "text-green-800" : "text-gray-400 group-hover:text-green-800"}`}>
                      {item.icon}
                    </div>
                    <div className="text-sm">{item.name}</div>
                    {((item.name === "Memos" && showNewMemoBadge) || (item.name === "Contact" && hasUnreadContactSubmissions)) && (
                      <div className={`ml-auto w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-green-600 animate-pulse"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 space-y-4">
          <div className="h-px bg-gray-100 mx-2" />
          
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full text-left outline-none group border-none bg-transparent p-0">
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                {session ? (
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-800 font-bold ring-1 ring-green-100 group-hover:ring-green-300 transition-all flex-shrink-0">
                    {session.name.charAt(0)}
                  </div>
                ) : (
                  <FaUserCircle className="w-10 h-10 text-gray-200 flex-shrink-0" />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate">{session?.name}</p>
                  <p className="text-[10px] uppercase text-gray-400 font-black truncate">{session?.role}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" className="w-[200px] p-2 ml-4 bg-white border border-gray-400 rounded-2xl">
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
      </div>
    </div>
  );
}
