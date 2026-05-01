"use client";

import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { listBunnyFiles, BunnyFile } from "@/app/actions/uploadOps";
import { toast } from "sonner";

interface ImageLibraryGridProps {
  onSelect: (url: string) => void;
  className?: string;
}

export function ImageLibraryGrid({ onSelect, className = "" }: ImageLibraryGridProps) {
  const [files, setFiles] = useState<BunnyFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await listBunnyFiles();
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else if (res.files) {
        setFiles(res.files);
      }
    } catch (e: any) {
      setError("Failed to fetch library.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] text-gray-400 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#5C9952]" />
        <p className="font-normal text-sm ">Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] text-red-500 ${className}`}>
        <AlertCircle className="h-8 w-8 mb-4 opacity-80" />
        <p className="font-medium text-sm text-center px-4">{error}</p>
        <button 
          onClick={fetchFiles}
          className="mt-4 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] text-gray-400 max-w-xs mx-auto text-center ${className}`}>
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="h-8 w-8 text-gray-300" />
        </div>
        <p className="font-bold text-[#4A4A4A] mb-1">No images found</p>
        <p className="text-sm font-medium text-gray-500">Images you upload will automatically appear in this library.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 ${className}`}>
      {files.map((file) => (
        <button
          key={file.url}
          onClick={() => onSelect(file.url)}
          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#5C9952] hover:ring-2 hover:ring-[#5C9952]/20 transition-all block focus:outline-none"
        >
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
          
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-[10px] text-white font-medium truncate w-full" title={file.name}>
              {file.name}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
