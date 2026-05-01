"use client";

import { useState, useEffect, useTransition } from "react";
import { fetchContactFormEntries } from "@/app/actions/adminOps"; // Make sure your actions file is accessible
import { Admins } from "@/app/generated/prisma/client";
import { Session } from "../AuthContext"; // Assuming you use NextAuth
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ContactFormWithReadBy } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

export default function ContactSubmissionsPage() {

  const [entries, setEntries] = useState<ContactFormWithReadBy[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [filter, setFilter] = useState("all"); // 'all', 'resolved', 'unresolved'
  const router = useRouter();
  const { session } = useAuth();

  const currentUser = session as Admins | undefined;

  useEffect(() => {
    startTransition(async () => {
      const fetchedEntries = await fetchContactFormEntries();
      setEntries(fetchedEntries as ContactFormWithReadBy[]);
    });
  }, []);

  const filteredEntries = entries.filter((entry) => {
    if (filter === "resolved") return !!entry.addressed;
    if (filter === "unresolved") return !entry.addressed;
    return true;
  });

  return (
    <main className="p-4  sm:p-6 md:p-8 tap-dark">
      <header className="mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Contact Submissions</h1>
        <div className="flex items-center gap-2 mt-3" role="group">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={` ${filter === "all" ? "tap-accent text-white" : ""}`}

          >
            All
          </Button>
          <Button
            variant={filter === "resolved" ? "default" : "outline"}
            onClick={() => setFilter("resolved")}
            className={` ${filter === "resolved" ? "tap-accent text-white" : ""}`}


          >
            Resolved
          </Button>
          <Button
            variant={filter === "unresolved" ? "default" : "outline"}
            className={` ${filter === "unresolved" ? "tap-accent text-white" : ""}`}
            onClick={() => setFilter("unresolved")}
          >
            Unresolved
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 pb-3 space-y-2">
                <Skeleton className="h-5 w-2/3 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
              {/* Card Content */}
              <div className="px-6 pb-6 space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
                {/* Status badge */}
                <Skeleton className="h-3.5 w-24 rounded-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 duration-150 transition-all">
          {filteredEntries.map((entry) => {
            const isUnread = currentUser
              ? !entry.readBy.some((admin) => admin.id === currentUser.id)
              : false;
            return (
              <Card
                key={entry.id}
                onClick={() => router.push(`/contact/${entry.id}`)}
                className={`cursor-pointer transition-shadow duration-300 hover:shadow-xl border-black/30 tap-dark ${isUnread
                  ? "shadow-lg shadow-blue-500/40 animate-pulse-slow border-blue-500"
                  : "shadow-sm"
                  }`}
              >
                <CardHeader>
                  <CardTitle className="truncate">
                    {entry.firstName} {entry.lastName}
                  </CardTitle>
                  <CardDescription>{entry.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {entry.message}
                  </p>
                  {
                    entry.addressed ? (
                      <p className="text-xs text-green-600 font-medium">Status: Resolved</p>
                    ) : (
                      <p className="text-xs text-red-600 font-medium">Status: Unresolved</p>
                    )
                  }
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}