import { ReactNode } from "react";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Donations Data | The African Parent",
  description: "View donations and fundraising efforts",
};


export default function DonationsDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}