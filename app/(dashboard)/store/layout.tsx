import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Manage Shop Items | The African Parent",
  description: "Manage shop items and listed products in the admin dashboard",
};


export default function BlogsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}