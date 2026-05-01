"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { MemoReaderClient } from "./components/MemoReaderClient";
import { getMemoById } from "@/app/actions/adminOps";
import type { MemoWithRelations } from "../../types";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MemoReaderPage() {
  const searchParams = useSearchParams();
  const memoId = searchParams.get("memoId");
  const { session } = useAuth();

  const [memo, setMemo] = useState<MemoWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memo) return;

    if (!memoId) {
      setLoading(false);
      setError("No memo ID provided.");
      return;
    }

    const fetchMemo = async () => {
      try {
        const fetchedMemo = await getMemoById(memoId);
        if (!fetchedMemo) {
          setError("Memo not found.");
        } else {
          setMemo(fetchedMemo);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading the memo.");
      } finally {
        setLoading(false);
      }
    };

    fetchMemo();
  }, [memoId]);

  if (loading) {
    return (
      <Card className="max-w-3xl mx-auto mt-6 p-4 border-black/30 tap-dark">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-3xl mx-auto mt-6 p-4 border-black/30 tap-dark border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive text-lg font-semibold">
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {session && memo ? (
        <MemoReaderClient initialMemo={memo} currentUser={session} />
      ) : (
        <Card className="max-w-3xl mx-auto mt-6 p-4 border-black/30 tap-dark">
          <CardHeader>
            <CardTitle>No memo to display</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please check the memo link or try again later.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
