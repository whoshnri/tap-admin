import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import DashboardHeader from "./components/DashboardHeader";
import { getSession } from "@/app/actions/authOps";
import { AuthProvider, Session } from "./AuthContext";

export const metadata: Metadata = {
  title: "Admin Dashboard | The African Parent",
  description: "TAP all-in-one CMS",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();


  if (!session) {
    redirect("/login?error=unauthorized");
  }

  return (
    <AuthProvider initialSession={session as Session} >
      <div className="antialiased h-dvh w-full flex flex-col md:flex-row bg-muted/40 overflow-hidden">
        <DashboardHeader />
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>

    </AuthProvider>
  );
}
