"use client";

import { useEffect } from "react";
import { RecentActivities } from "../components/RecentActivities";
import { useAuth } from "../AuthContext";
import { Admins } from "@/app/generated/prisma/client";

export default function NotificationsPage() {
  const { session, notifications, loadNotifications } = useAuth();

  useEffect(() => {
    if (session) {
      loadNotifications(session as Admins);
    }
  }, [session, loadNotifications]);


  useEffect(() => {
    if (notifications) {
      localStorage.setItem("notificationCount", notifications.length.toString());
    }
  }, [notifications]);

  return (
    <div className="max-w-3xl mx-auto my-10 px-4">
      <div className="border border-black/30 tap-dark rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Recent Activities
          </h1>
          <span className="text-sm text-muted-foreground">
            {notifications.length} total
          </span>
        </div>

        <div className="border-t border-gray-200 pt-4">
          {notifications.length > 0 ? (
            <RecentActivities recentActivities={notifications} />
          ) : (
            <div className="py-10 text-center text-muted-foreground animate-pulse">
              No notifications yet 📭
            </div>
          )}
        </div>

        <p className="pt-4 text-xs text-center text-green-600">
          Notifications are filtered automatically based on your role.
        </p>
      </div>
    </div>
  );
}
