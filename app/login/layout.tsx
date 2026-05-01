import type { Metadata } from "next";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Login to Dashboard | The African Parent",
  description: "Enter your email and password to access the admin dashboard.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return <div className={`antialiased`} >
        {children}
  </div>;
}
