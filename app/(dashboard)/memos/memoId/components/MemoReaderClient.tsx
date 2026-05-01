"use client";

import { useEffect, useRef } from "react";
import { Admins, Memo } from "@/app/generated/prisma/client";
import { markMemoAsRead } from "@/app/actions/adminOps";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Session } from "../../../AuthContext";


export type MemoWithRelations = Memo & {
  author: Admins;
  recipients: Admins[];
  readBy: Admins[];
};

interface MemoReaderClientProps {
  initialMemo: MemoWithRelations;
  currentUser: Admins | Session;
}

export function MemoReaderClient({ initialMemo, currentUser }: MemoReaderClientProps) {
  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    // Check if the current user has already read the memo
    const alreadyRead = initialMemo.readBy.some(
      (reader) => reader.id === currentUser.id
    );


    if (!alreadyRead && !hasMarkedAsRead.current) {
      hasMarkedAsRead.current = true;
      markMemoAsRead(initialMemo.id, currentUser);
    }
  }, [initialMemo.id, initialMemo.readBy, currentUser]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-md rounded-lg p-6 border border-black/30 tap-dark">
        <div className="mb-6">
          <Link
            href="/memos"
            className="flex items-center text-sm text-[#4A7044] hover:underline"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to All Memos
          </Link>
        </div>

        <div className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Subject: {initialMemo.title}</h1>
          <div className="text-sm text-gray-500 mt-2 space-y-1">
            <p>
              <strong>From:</strong> {initialMemo.author.name} &lt;{initialMemo.author.email}&gt;
            </p>
            <p>
              <strong>To:</strong>{" "}
              {initialMemo.recipients.length > 0
                ? initialMemo.recipients.map((r) => r.name).join(", ")
                : "All Admins"}
            </p>
            <p>
              <strong>Sent:</strong>{" "}
              {new Date(initialMemo.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="prose lg:prose-xl max-w-none text-gray-800 whitespace-pre-wrap">
          <div>{initialMemo.content}</div>
        </div>
      </div>
    </div>
  );
}
