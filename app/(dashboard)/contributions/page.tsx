// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchContributorFormEntries } from "@/app/actions/adminOps";
import Link from "next/link";

// Define the shape of a contribution
interface Contribution {
  id: number;
  name: string;
  email: string;
  status: "Adopted" | "Revised" | "UnderReview" | "Declined";
  createdAt: Date;
}

// Array of possible statuses for generating filter buttons
const contributionStatuses: (Contribution["status"] | "All")[] = [
  "All",
  "Adopted",
  "Revised",
  "UnderReview",
  "Declined",
];

// Helper function to determine the styling based on the contribution status
const getStatusStyles = (status: Contribution["status"]) => {
  switch (status) {
    case "Adopted":
      return "bg-green-100 border-green-500";
    case "Revised":
      return "bg-yellow-100 border-yellow-500";
    case "UnderReview":
      return "bg-blue-100 border-blue-500";
    case "Declined":
      return "bg-red-100 border-red-500";
    default:
      return "bg-gray-100 border-gray-500";
  }
};

export default function ContributionsPage() {
  const [entries, setEntries] = useState<Contribution[]>([]);
  const [filterStatus, setFilterStatus] = useState<Contribution["status"] | "All">("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      const fetchedEntries = await fetchContributorFormEntries();
      setEntries(fetchedEntries);
      setLoading(false);
    }
    loadEntries();
  }, []);

  // Filter entries based on the selected status
  const filteredEntries = entries.filter((entry) => {
    if (filterStatus === "All") {
      return true;
    }
    return entry.status === filterStatus;
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold tracking-tight my-4">Contributor Form Entries</h1>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {contributionStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filterStatus === status
                ? "bg-black text-white shadow-md"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <Link href={`/contributions/${entry.id}`} key={entry.id}>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-transform hover:scale-105 border-black/30 tap-dark ${getStatusStyles(
                    entry.status
                  )}`}
                >
                  <h2 className="text-lg font-semibold">{entry.name}</h2>
                  <p className="text-gray-600">{entry.email}</p>
                  <p className="text-sm text-gray-500">
                    Submitted on:{" "}
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-2 font-medium">Status: {entry.status}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 md:col-span-3">
              No entries found for the selected status.
            </p>
          )}
        </div>
      )}
    </div>
  );
}