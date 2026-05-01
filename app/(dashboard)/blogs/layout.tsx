import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Manage Blogs | The African Parent",
  description: "Manage blogs and article content",
};


export default function BlogsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}