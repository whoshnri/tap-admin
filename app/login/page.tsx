import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { error } = await searchParams;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center tap-dark">Loading...</div>}>
      <LoginClient error={typeof error === "string" ? error : null} />
    </Suspense>
  );
}
