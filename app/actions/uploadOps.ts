"use server";

import * as BunnyStorageSDK from "@bunny.net/storage-sdk";
import { v4 as uuidv4 } from "uuid";

const ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY!;
const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE!;
const PULL_ZONE = process.env.BUNNY_PULL_ZONE!;

const storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
  BunnyStorageSDK.regions.StorageRegion.London,
  STORAGE_ZONE,
  ACCESS_KEY,
);

export async function uploadToBunny(formData: FormData): Promise<{ url: string } | { error: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    // Strong server-side guardrail: check MIME type
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    const isAllowed = allowedTypes.some((type) => file.type.startsWith(type));

    if (!isAllowed) {
      return {
        error: "Invalid file type. Only images, PDFs, and spreadsheets are allowed.",
      };
    }

    // Generate a unique filename to avoid collisions
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `/uploads/${fileName}`;

    // Using file.stream() to get a ReadableStream as required by the SDK
    const stream = file.stream() as any;
    await BunnyStorageSDK.file.upload(storageZone, filePath, stream);

    // Construct the public URL
    const publicUrl = `https://${PULL_ZONE}${filePath}`;

    return { url: publicUrl };
  } catch (error: any) {
    console.error("Bunny.net Upload Error:", error);
    return { error: error.message || "Failed to upload file" };
  }
}

export interface BunnyFile {
  name: string;
  url: string;
  lastChanged: string;
}

export async function listBunnyFiles(): Promise<{ files?: BunnyFile[], error?: string }> {
  try {
    const url = `https://uk.storage.bunnycdn.com/${STORAGE_ZONE}/uploads/`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        AccessKey: ACCESS_KEY,
        Accept: "application/json"
      },
      next: { revalidate: 0 } // Always fresh
    });

    if (!response.ok) {
      if (response.status === 404) return { files: [] }; // Directory might be empty or missing
      throw new Error(`Failed to fetch library: ${response.statusText}`);
    }

    const data = await response.json();
    
    const files: BunnyFile[] = data
      .filter((file: any) => !file.IsDirectory && file.ObjectName.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i))
      .map((file: any) => ({
        name: file.ObjectName,
        url: `https://${PULL_ZONE}/uploads/${file.ObjectName}`,
        lastChanged: file.LastChanged
      }));

    files.sort((a, b) => new Date(b.lastChanged).getTime() - new Date(a.lastChanged).getTime());

    return { files };
  } catch (error: any) {
    console.error("Bunny.net List Error:", error);
    return { error: error.message || "Failed to list files." };
  }
}
