// app/contributions/[contributionId]/page.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  fetchSpecificContributionEntry,
  verifyAdmin,
  changeContributionStatus,
} from "@/app/actions/adminOps";
import { useAuth } from "../../../AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Session } from "../../../AuthContext";
import { Admins, Contribution } from "@/app/generated/prisma/client";
import { Prisma } from "@/app/generated/prisma/client";
import { toast } from "sonner";

type ContributionStatus = "Adopted" | "Revised" | "UnderReview" | "Declined";

interface ContributionDetailPageProps {
  params: string;
}

type ContributorLink = {
  name: string;
  link: string;
};

export default function ContributionDetailPage({
  params,
}: ContributionDetailPageProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [entry, setEntry] = useState<Contribution | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [newStatus, setNewStatus] = useState<ContributionStatus | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const contributionId = parseInt(params, 10);
  const [links, setLinks] = useState<ContributorLink[]>([]);

  const parseLinks = (links: Prisma.JsonValue): ContributorLink[] => {
    if (Array.isArray(links)) {
      return links.filter(
        (item): item is ContributorLink =>
          typeof item === "object" &&
          item !== null &&
          "name" in item &&
          "link" in item
      );
    }
    return [];
  };

  useEffect(() => {
    if (contributionId) {
      startLoading(async () => {
        const fetchedEntry =
          await fetchSpecificContributionEntry(contributionId);
        setEntry(fetchedEntry);
        if (fetchedEntry) setLinks(parseLinks(fetchedEntry.links));
      });
    }
  }, [contributionId]);

  const handleStatusSelect = (status: ContributionStatus) => {
    if (status !== entry?.status) {
      setNewStatus(status);
      setIsAlertOpen(true);
      setError("");
      setPassword("");
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!session || !newStatus || !entry) return;

    startSubmitting(async () => {
      const isAdmin = await verifyAdmin(session?.email ?? "", password);
      if (!isAdmin) {
        toast.error("Authentication Failed", {
          description: "Incorrect password. Please try again.",
        });
        setError("Incorrect password. Please try again.");
        return;
      }

      const success = await changeContributionStatus(
        entry.id,
        newStatus,
        session as Admins
      );

      if (success) {
        toast.success("Status Updated!", {
          description: `Contribution status changed to ${newStatus}.`,
        });
        const updatedEntry = await fetchSpecificContributionEntry(entry.id);
        setEntry(updatedEntry);
      } else {
        toast.error("Update Failed", {
          description: "Could not update the contribution status.",
        });
      }
      setIsAlertOpen(false);
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <Skeleton className="h-9 w-36 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/3 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-48" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Contribution not found.
        </p>
        <Button onClick={() => router.push("/contributions")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Contributions
        </Button>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Button variant="ghost" onClick={() => router.push("/contributions")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Contributions
      </Button>

      <Card className="border-black/30 tap-dark">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">{entry.name}</CardTitle>
              <CardDescription className="pt-1">{entry.email}</CardDescription>
              <CardDescription>{entry.phoneNumber}</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground pt-1.5">
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Content</h3>
            <div className="prose prose-sm max-w-none dark:prose-invert bg-muted p-4 rounded-md whitespace-pre-wrap">
              <p>{entry.content}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Links</h3>
            <div className="bg-muted p-4 rounded-md space-y-2">
              {links.length > 0 ? (
                links.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{item.name}</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[200px] text-right"
                    >
                      {item.link}
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No links provided.
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-muted-foreground">
            Manage the contribution status.
          </p>
          <Select
            value={entry.status}
            onValueChange={(value: ContributionStatus) =>
              handleStatusSelect(value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UnderReview">Under Review</SelectItem>
              <SelectItem value="Adopted">Adopted</SelectItem>
              <SelectItem value="Revised">Revised</SelectItem>
              <SelectItem value="Declined">Declined</SelectItem>
            </SelectContent>
          </Select>
        </CardFooter>
      </Card>

      {/* Confirm Status Change Modal */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="border-black/30 tap-dark bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the status to{" "}
              <strong className="text-foreground">{newStatus}</strong>. This
              action cannot be undone. Please enter your admin password to
              proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              id="password"
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-black/30 tap-dark"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              disabled={!password || isSubmitting}
            >
              {isSubmitting ? "Confirming..." : "Confirm & Update Status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
