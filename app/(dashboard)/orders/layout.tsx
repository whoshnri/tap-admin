import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Order Transaction Data | The African Parent",
  description: "Order Transaction Data in the admin dashboard",
};


export default function BlogsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}