"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../AuthContext"; // Your Auth Context
import { Admins } from "@/app/generated/prisma/client";
import { fetchAdminSpecificMemos, fetchAdmins } from "@/app/actions/adminOps";
import Link from "next/link";
import type { MemoWithRelations } from "../types";

import { NewMemoModal } from "./components/NewMemoModal";
import { ReadersListModal } from "./components/NewMemoModal";

export default function MemosPage() {
  const { session, memos, loadMemos } = useAuth();
  const currentUser = session as Admins;

  // State
  const [allAdmins, setAllAdmins] = useState<Admins[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"incoming" | "outgoing">("incoming");
  const [isNewMemoOpen, setIsNewMemoOpen] = useState(false);
  const [readersModalMemo, setReadersModalMemo] =
    useState<MemoWithRelations | null>(null);

  // Data Fetching

  useEffect(() => {
    if (!session) return;

    const loadPageData = async () => {
      await loadMemos(currentUser); // ok if loadMemos is memoized with useCallback
      const admins = await fetchAdmins();
      setAllAdmins(admins as Admins[]);
      setIsLoading(false);
    };

    loadPageData();
  }, [session, loadMemos]);

  useEffect(() => {
    localStorage.setItem("memoCount", memos.length.toString());
  }, [memos]);


  // Filtering Logic
  const filteredMemos = useMemo(() => {
    if (filter === "incoming") {
      return memos.filter((memo) => memo.authorId !== currentUser.id);
    }
    return memos.filter((memo) => memo.authorId === currentUser.id);
  }, [memos, filter, currentUser.id]);

  if (!currentUser)
    return (
      <div className="p-8 text-center">
        <p>Please log in.</p>
      </div>
    );

  return (
    <>
      <NewMemoModal
        isOpen={isNewMemoOpen}
        onClose={() => setIsNewMemoOpen(false)}
        allAdmins={allAdmins.filter((admin) => admin.id !== currentUser.id)}
        currentUser={currentUser}
        onMemoSent={() => loadMemos(currentUser)}
      />
      <ReadersListModal
        isOpen={!!readersModalMemo}
        onClose={() => setReadersModalMemo(null)}
        memo={readersModalMemo}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Memos</h1>
          <button
            onClick={() => setIsNewMemoOpen(true)}
            className="bg-[#4A7044] text-white font-semibold py-2 px-4 rounded-md hover:bg-[#4A7044]/90 transition-colors"
          >
            New Memo
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
              onClick={() => setFilter("incoming")}
              className={`${filter === "incoming" ? "border-[#4A7044] text-[#4A7044]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Incoming
            </button>
            <button
              onClick={() => setFilter("outgoing")}
              className={`${filter === "outgoing" ? "border-[#4A7044] text-[#4A7044]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Outgoing
            </button>
          </nav>
        </div>

        {/* Memos List */}
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {filteredMemos.length > 0 ? (
              filteredMemos.map((memo) => (
                <MemoPreviewCard
                  key={memo.id}
                  memo={memo}
                  currentUser={currentUser}
                  onShowReaders={() => setReadersModalMemo(memo)}
                />
              ))
            ) : (
              <p>No {filter} memos found.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Sub-component for Memo Previews
function MemoPreviewCard({
  memo,
  currentUser,
  onShowReaders,
}: {
  memo: MemoWithRelations;
  currentUser: Admins;
  onShowReaders: () => void;
}) {

  const isUnread = !memo.readBy.some((reader) => reader.id === currentUser.id) && memo.authorId !== currentUser.id;

  return (
    <div
      className={`bg-white shadow rounded-lg p-4 flex justify-between items-center transition-shadow hover:shadow-md border-black/30 tap-dark ${isUnread ? "border-l-4 border-blue-500" : ""}`}
    >
      <div>
        <h3 className="font-bold text-lg text-gray-800">{memo.title}</h3>
        <p className="text-sm text-gray-600">
          {memo.authorId === currentUser.id ? (
            <>
              To:{" "}
              <span className="font-medium">
                {memo.recipients.length > 0
                  ? memo.recipients.map((r) => r.name).join(", ")
                  : "All Admins"}
              </span>
            </>
          ) : (
            <>
              From: <span className="font-medium">{memo.author.name}</span>
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(memo.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {memo.authorId === currentUser.id && (
          <button
            onClick={onShowReaders}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            View Readers ({memo.readBy.length})
          </button>
        )}
        <Link
          href={`/memos/memoId?memoId=${memo.id}`}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 text-sm rounded-md"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
