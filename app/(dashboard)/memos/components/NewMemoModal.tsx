// app/dashboard/memos/modals.tsx

"use client";

import { useState } from "react";
import { sendMemo } from "@/app/actions/adminOps";
import { Admins } from "@/app/generated/prisma/client";
import { toast } from "sonner";
import type { MemoWithRelations } from "../../types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";


// --- NEW MEMO MODAL COMPONENT ---

interface NewMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  allAdmins: Admins[];
  currentUser: Admins;
  onMemoSent: () => void; // Callback to refresh the list
}

export function NewMemoModal({
  isOpen,
  onClose,
  allAdmins,
  currentUser,
  onMemoSent,
}: NewMemoModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);

  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setIsSending(true);
    try {
      const recipients = allAdmins.filter((admin) =>
        recipientIds.includes(admin.id)
      );
      const result = await sendMemo(content, currentUser, title, recipients);

      if (result.success) {
        toast.success("Memo sent successfully!");
        // Reset state before closing
        setTitle("");
        setContent("");
        setRecipientIds([]);
        onMemoSent(); // Trigger refresh in parent
        onClose(); // Close the modal
      } else {
        toast.error(result.message || "Failed to send memo.");
      }
    } catch (error) {
      toast.error("An error occurred while sending the memo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="responsive-right" className="sm:max-w-[500px] tap-dark p-4 overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle>Send New Memo</SheetTitle>
          <SheetDescription>
            Create and send a memo to other administrators.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="title" className="flex items-center gap-1">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Memo title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content" className="flex items-center gap-1">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              rows={6}
              placeholder="Write your memo here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipients">Recipients</Label>
              <span className="text-[10px] text-muted-foreground">
                {recipientIds.length > 0
                  ? `${recipientIds.length} selected`
                  : "All Admins"}
              </span>
            </div>
            
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 bg-gray-50/50">
              {allAdmins.map((admin) => (
                <div key={admin.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded transition-colors">
                  <input
                    type="checkbox"
                    id={`admin-${admin.id}`}
                    checked={recipientIds.includes(admin.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRecipientIds([...recipientIds, admin.id]);
                      } else {
                        setRecipientIds(recipientIds.filter(id => id !== admin.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[#4A7044] focus:ring-[#4A7044]"
                  />
                  <label htmlFor={`admin-${admin.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full">
                    {admin.name}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500">
              If none are selected, memo is sent to all admins.
            </p>
          </div>

          <SheetFooter className="mt-4 flex-row justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4A7044] hover:bg-[#4A7044]/90 text-white"
              disabled={isSending}
            >
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Memo
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// --- READERS LIST MODAL COMPONENT ---

interface ReadersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  memo: MemoWithRelations | null;
}

export function ReadersListModal({
  isOpen,
  onClose,
  memo,
}: ReadersListModalProps) {
  if (!memo) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="responsive-right" className="sm:max-w-[400px] tap-dark p-4 overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle>Memo Readers</SheetTitle>
          <SheetDescription>
            List of administrators who have read this memo.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          {memo.readBy.length > 0 ? (
            <ul className="space-y-4">
              {memo.readBy.map((admin) => (
                <li key={admin.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50/50">
                  <div className="h-8 w-8 rounded-full bg-[#4A7044]/10 flex items-center justify-center text-[#4A7044] font-bold text-xs">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{admin.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">No one has read this memo yet.</p>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
