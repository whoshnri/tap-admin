// AuthContext.tsx (updated)
"use client";
import { createContext, useContext, ReactNode, useState, useCallback, useRef } from "react";
import { Admins } from "@/app/generated/prisma/client";
import { logout } from "@/app/actions/authOps";
import { useRouter } from "next/navigation";
import { fetchAdminSpecificMemos, fetchContactFormEntries, fetchNotifications } from "../actions/adminOps";
import { Notification } from "@/app/generated/prisma/client";
import type { ContactFormWithReadBy, MemoWithRelations, Session } from "./types";
export type { Session } from "./types";

interface AuthContextType {
  session: Session | null;
  logout: () => Promise<void>;
  memoCount: number;
  memos: MemoWithRelations[];
  loadMemos: (currentUser: Admins) => Promise<void>;
  setMemos: (memos: MemoWithRelations[]) => void;
  setMemoCount: (count: number) => void;
  notificationCount: number;
  loadNotifications: (session: Admins) => Promise<void>;
  setNotificationCount: (count: number) => void;
  loadContactFormSubmissions: (currentUser: Admins) => Promise<void>;
  notifications: Notification[];
  isUnreadContactSubmissions: boolean;
  setNotifications: (notifications: Notification[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, initialSession }: { children: ReactNode; initialSession: Session | null; }) => {
  const router = useRouter();
  const [memos, setMemos] = useState<MemoWithRelations[]>([]);
  const [memoCount, setMemoCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isUnreadContactSubmissions, setIsUnreadContactSubmissions] = useState<boolean>(false);


  const isLoadingMemosRef = useRef(false);
  const isLoadingNotificationsRef = useRef(false);

  const loadMemos = useCallback(async (currentUser: Admins) => {
    if (!currentUser) return;
    if (isLoadingMemosRef.current) return;
    try {
      isLoadingMemosRef.current = true;
      const data = await fetchAdminSpecificMemos(currentUser, 0, 100);
      // optional: quick equality check to avoid no-op updates
      if (data.length !== memos.length || data.some((d, i) => d.id !== memos[i]?.id)) {
        setMemos(data);
        console.log("Fetched memos:", data);
        setMemoCount(data.length);
      }
    } finally {
      isLoadingMemosRef.current = false;
    }
  }, [memos]);

  const loadContactFormSubmissions = useCallback(async (currentUser: Admins) => {
    if (!currentUser) return;
    const contactSubmissions = await fetchContactFormEntries();
    const hasUnread = contactSubmissions.some((entry: ContactFormWithReadBy) =>
      !entry.readBy.some((admin) => admin.id === currentUser.id)
    );
    setIsUnreadContactSubmissions(hasUnread);
  }, []);


const loadNotifications = useCallback(async (currentUser: Admins) => {
  if (!currentUser) return;
  if (isLoadingNotificationsRef.current) return;
  try {
    isLoadingNotificationsRef.current = true;
    const data = await fetchNotifications(currentUser, 0, 100);
    // console.log("Fetched notifications:", data);
    setNotifications(data);
    setNotificationCount(data.length);
  } finally {
    isLoadingNotificationsRef.current = false;
  }
}, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{
      memos,
      setMemos,
      loadMemos,
      session: initialSession,
      loadNotifications,
      notifications,
      setNotifications,
      logout: handleLogout,
      memoCount,
      setMemoCount,
      notificationCount,
      loadContactFormSubmissions,
      isUnreadContactSubmissions,
      setNotificationCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
