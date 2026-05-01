import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Manage Admins | The African Parent",
  description: "Manage Admin data in the admin dashboard",
};


export default function DonationsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}