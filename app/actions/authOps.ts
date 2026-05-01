"use server";

import { prisma } from "@/prisma/engine";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Admins } from "@/app/generated/prisma/client";
import {verifyPassword} from "@/app/actions/adminOps";


const RETRYABLE_DB_ERRORS = ["EAI_AGAIN", "P1001"];

function isRetryableDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: unknown; message?: unknown };
  if (typeof maybeError.code === "string" && RETRYABLE_DB_ERRORS.includes(maybeError.code)) {
    return true;
  }
  return (
    typeof maybeError.message === "string" &&
    (maybeError.message.includes("EAI_AGAIN") ||
      maybeError.message.includes("getaddrinfo") ||
      maybeError.message.includes("Can't reach database server"))
  );
}

async function findAdminByEmailWithRetry(email: string) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.admins.findUnique({ where: { email } });
    } catch (error) {
      const canRetry = isRetryableDbError(error) && attempt < maxAttempts;
      if (!canRetry) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }

  return null;
}

async function getVerifiedAdmin(email: string, password: string): Promise<Omit<Admins, 'password'> | null> {
  const admin = await findAdminByEmailWithRetry(email);

  if (admin && (await verifyPassword(password, admin.password))) {
    const { password, ...adminData } = admin;
    return adminData;
  }
  return null;
}

export async function login(email: string, password: string): Promise<{ error?: string }> {
  let adminData: Omit<Admins, "password"> | null = null;
  try {
    adminData = await getVerifiedAdmin(email, password);
  } catch (error) {
    if (isRetryableDbError(error)) {
      console.error("Verification error:", error);
      return { error: "Temporary database connection issue. Please try again." };
    }
    throw error;
  }

  if (!adminData) {
    return { error: "Invalid email or password." };
  }
  const session = {
    ...adminData,
  };

  // Set the session cookie
  (await cookies()).set("session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return {};
}


export async function logout() {
  (await cookies()).delete("session");
  redirect("/login");
}


export async function getSession() {
  const sessionCookie = (await cookies()).get("session")?.value;
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie);
  } catch (error) {
    return null;
  }
}
