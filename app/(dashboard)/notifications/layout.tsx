import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Notifications | The African Parent",
  description: "Notifications dashboard for The African Parent admin    ",
};


export default function NotificationsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="tap-dark">{children}</div>;
}