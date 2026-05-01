"use client";

import { useState, useEffect, useTransition } from "react";
import {
  fetchSpecificContactFormEntry,
  sendContactFormReply,
  deleteContactFormEntry,
} from "@/app/actions/adminOps"; // Adjust path to your actions file
import { ContactForm, Admins } from "@/app/generated/prisma/client";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { useAuth } from "../../AuthContext";
import { FaMapPin } from "react-icons/fa";

interface ContactFormWithReadBy extends ContactForm {
  readBy: Admins[];
}

export default function ContactDetailPage() {
  const [entry, setEntry] = useState<ContactFormWithReadBy | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [replyMessage, setReplyMessage] = useState("");
  const params = useParams<{ contactFormId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const contactFormId = Number.parseInt(params.contactFormId, 10);

  useEffect(() => {
    if (contactFormId && session) {
      startLoading(async () => {
        const fetchedEntry = await fetchSpecificContactFormEntry(
          contactFormId,
          session as Admins
        );
        setEntry(fetchedEntry as ContactFormWithReadBy);
      });
    }
  }, [contactFormId, session]);

  const handleSendReply = async () => {
    if (!entry || !replyMessage.trim() || !session) return;
    startSubmitting(async () => {
      const success = await sendContactFormReply(
        entry.id,
        replyMessage,
        session as Admins
      );
      if (success) {
        toast.success("Reply Sent!", {
          description: "The user has been notified.",
        });
        const updatedEntry = await fetchSpecificContactFormEntry(
          entry.id,
          session as Admins
        );
        setEntry(updatedEntry as ContactFormWithReadBy);
        setReplyMessage("");
      } else {
        toast.error("Error", { description: "Failed to send reply." });
      }
    });
  };

  const handleDeleteEntry = async () => {
    if (session?.role !== "Owner" || !entry) return;
    startSubmitting(async () => {
      const success = await deleteContactFormEntry(entry.id);
      if (success) {
        toast.success("Entry Deleted", {
          description: "The submission has been removed.",
        });
        router.push("/admin/contact");
      } else {
        toast.error("Error", { description: "Failed to delete entry." });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl tap-dark mx-auto p-4 sm:p-8">
        <Skeleton className="h-9 w-36 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center tap-dark p-10">
        <p className="mb-4">Contact form submission not found.</p>
        <Button onClick={() => router.push("/admin/contact")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <main className="max-w-4xl tap-dark mx-auto p-4 sm:p-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/contact")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Submissions
      </Button>
      <Card className="overflow-hidden border-black/30 tap-dark">
        <CardHeader className="">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {entry.firstName} {entry.lastName}
              </CardTitle>
              <CardDescription>{entry.email}</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground pt-1">
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            <FaMapPin className="mr-2 h-4 w-4 inline-block" />
            {entry.location}
          </p>
          <div className="prose prose-sm max-w-none dark:prose-invert bg-muted p-4 rounded-md">
            <p>{entry.message}</p>
          </div>
          {entry.reply && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Your Reply</h3>
              <div className="prose prose-sm max-w-none dark:prose-invert bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-700">
                <p>{entry.reply}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Replied by: {entry.addressedBy} on{" "}
                  {entry.addressedAt &&
                    new Date(entry.addressedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {!entry.addressed && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Reply</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl border-black/30 tap-dark bg-white">
                <DialogHeader>
                  <DialogTitle>Reply to {entry.firstName}</DialogTitle>
                  <DialogDescription>
                    Your message will be sent directly to {entry.email}. This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-4 bg-muted rounded-md">
                  <p>Message Content:</p>
                  <p>{entry.message}</p>
                </div>
                <Textarea
                  placeholder="Type your response here..."
                  rows={10}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="my-4 border-black/30 tap-dark"
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={!replyMessage.trim() || isSubmitting}>
                        {isSubmitting ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Confirm & Send
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-black/30 tap-dark bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will send the email. You cannot edit or delete a
                          reply after it is sent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <DialogClose asChild>
                          <AlertDialogAction onClick={handleSendReply}>
                            Send Reply
                          </AlertDialogAction>
                        </DialogClose>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {session?.role === "Owner" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent and cannot be undone. The
                    submission will be removed forever.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteEntry}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
