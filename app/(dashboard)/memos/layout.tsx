import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Memos | The African Parent",
  description: "View and manage memos in the admin dashboard",
};


export default function MemosDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="tap-dark">{children}</div>;
}