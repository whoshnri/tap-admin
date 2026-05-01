import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Manage Your Account | The African Parent",
  description: "View and manage your account settings in the admin dashboard",
};


export default function DonationsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}