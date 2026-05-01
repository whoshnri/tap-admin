"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadComponent } from "./UploadComponent";
import { ImageLibraryGrid } from "./ImageLibraryGrid";
import { Link as LinkIcon, Upload, ImageIcon, FolderOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onUploadComplete?: (url: string) => void;
  maxFiles?: number;
  accept?: string;
}

export function UploadDialog({
  isOpen,
  onOpenChange,
  title = "Upload Files",
  description = "Select or drag and drop files to upload.",
  onUploadComplete,
  maxFiles,
  accept = "image/*",
}: UploadDialogProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploadMode, setUploadMode] = useState<"device" | "library">("device");
  const [imageUrl, setImageUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      setUrlError("Please enter an image URL.");
      return;
    }
    try {
      new URL(imageUrl.trim());
    } catch {
      setUrlError("Please enter a valid URL.");
      return;
    }
    setUrlError("");
    onUploadComplete?.(imageUrl.trim());
    setImageUrl("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setImageUrl("");
      setUrlError("");
      setMode("upload");
      setUploadMode("device");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} >
      <DialogContent className="bg-white border border-black/10 shadow-none tap-dark sm:max-w-lg p-6 rounded-2xl">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle className="text-xl font-black text-[#2D4A29] leading-tight tracking-normal">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-gray-500 mt-1 leading-snug tracking-normal">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-4 py-4 mb-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
          <button 
            type="button"
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors select-none ${mode === "upload" ? "text-[#5C9952]" : "text-gray-400 hover:text-gray-600"}`} 
            onClick={() => setMode("upload")}
          >
            <Upload className="h-4 w-4" />
            Upload File
          </button>
          
          <Switch 
            checked={mode === "url"} 
            onCheckedChange={(checked) => setMode(checked ? "url" : "upload")} 
            className="data-[state=checked]:bg-[#5C9952] data-[state=unchecked]:bg-[#5C9952]"
          />
          
          <button
            type="button"
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors select-none ${mode === "url" ? "text-[#5C9952]" : "text-gray-400 hover:text-gray-600"}`} 
            onClick={() => setMode("url")}
          >
            <LinkIcon className="h-4 w-4" />
            Paste URL
          </button>
        </div>

        {mode === "upload" ? (
          <div className="space-y-4">
            <div className="flex rounded-md border border-gray-200 p-1 bg-gray-50/80 mb-2">
              <button
                type="button"
                onClick={() => setUploadMode("device")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] uppercase tracking-wider font-bold rounded transition-all duration-200 ${uploadMode === "device"
                    ? "bg-white text-[#2D4A29] shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                From Device
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("library")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] uppercase tracking-wider font-bold rounded transition-all duration-200 ${uploadMode === "library"
                    ? "bg-white text-[#2D4A29] shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                From Library
              </button>
            </div>

            {uploadMode === "device" ? (
              <UploadComponent
                onUploadComplete={(url) => {
                  onUploadComplete?.(url);
                }}
                onDone={() => handleOpenChange(false)}
                maxFiles={maxFiles}
                accept={accept}
              />
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm max-h-[50vh] overflow-y-auto">
                <ImageLibraryGrid 
                  onSelect={(url) => {
                    onUploadComplete?.(url);
                    handleOpenChange(false);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* URL Preview */}
            {imageUrl.trim() && !urlError && (
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center">
                <img
                  src={imageUrl.trim()}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={() => setUrlError("Could not load image from this URL.")}
                />
              </div>
            )}

            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-normal">
                Image URL
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setUrlError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#5C9952] focus:ring-1 focus:ring-[#5C9952]/20 transition-all"
                  autoFocus
                />
              </div>
              {urlError && (
                <p className="text-xs font-medium text-red-500">{urlError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!imageUrl.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#5C9952] hover:bg-[#4a7c42] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Insert Image
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
