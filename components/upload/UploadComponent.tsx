"use client";

import React, { useState, useRef } from "react";
import { Upload, X, File, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ImageLibraryGrid } from "./ImageLibraryGrid";

import { uploadToBunny } from "@/app/actions/uploadOps";

interface UploadComponentProps {
  onUploadComplete?: (url: string) => void;
  onDone?: () => void;
  maxFiles?: number;
  accept?: string;
}

export function UploadComponent({
  onUploadComplete,
  onDone,
  maxFiles = 1, // Defaulting to 1 for this use case
  accept = "image/*",
}: UploadComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<"device" | "library">("device");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    const validFiles = newFiles.filter((file) => {
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      return acceptedTypes.some((type) => {
        if (type === "image/*") return fileType.startsWith("image/");
        if (type.endsWith("/*"))
          return fileType.startsWith(type.replace("/*", ""));
        if (type.startsWith(".")) return fileName.endsWith(type);
        return fileType === type;
      });
    });

    if (validFiles.length < newFiles.length) {
      toast.error("Invalid file type. Please check the allowed formats.");
    }

    const selected = validFiles.slice(0, maxFiles);
    setFiles(selected);
    if (selected[0] && selected[0].type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected[0]));
    }
  };

  const removeFile = (index: number) => {
    setFiles([]);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(10); // Start progress

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      // Simple progress simulation alongside real upload for UI feedback
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const result = await uploadToBunny(formData);
      clearInterval(progressInterval);

      if ("url" in result) {
        setUploadedUrl(result.url);
        setProgress(100);
        onUploadComplete?.(result.url);
      } else {
        toast.error(result.error);
        setProgress(0);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("An unexpected error occurred during upload.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {accept.includes("image/") && (
        <div className="flex rounded-md border border-gray-200 p-1 bg-gray-50/80 mb-2">
          <button
            type="button"
            onClick={() => setUploadMode("device")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] uppercase tracking-wider font-bold rounded transition-all duration-200 ${
              uploadMode === "device"
                ? "bg-white text-[#2D4A29] shadow-sm border border-gray-100"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            From Device
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("library")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] uppercase tracking-wider font-bold rounded transition-all duration-200 ${
              uploadMode === "library"
                ? "bg-white text-[#2D4A29] shadow-sm border border-gray-100"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            From Library
          </button>
        </div>
      )}

      {uploadMode === "device" ? (
        <>
          {files.length === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3",
            dragActive
              ? "border-[#5C9952] bg-[#5C9952]/5"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum {maxFiles} {maxFiles === 1 ? "file" : "files"}
              {accept.includes("image/") && accept.includes("pdf")
                ? " (Images or PDFs)"
                : accept.includes("image/")
                ? " (Images only)"
                : (accept.includes("pdf") || accept.includes("sheet") || accept.includes("xls") || accept.includes("csv"))
                ? " (PDF or Sheets)"
                : ""}
            </p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-medium text-gray-700">Selected File</h4>
          </div>
          
          {/* Image Preview */}
          {previewUrl && (
            <div className="relative h-48 w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center mb-2">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 text-[#5C9952] animate-spin" />
                    <span className="text-sm font-normal text-[#2D4A29]">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-2">
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <File className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                {!uploading && !uploadedUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(i);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {(uploading || uploadedUrl) && progress === 100 && (
                  <CheckCircle2 className="h-5 w-5 text-[#5C9952]" />
                )}
              </div>
            ))}
          </div>

          {uploadedUrl && (
            <div className="p-3 bg-green-50/50 border border-[#5C9952]/20 rounded-xl space-y-1">
              <p className="text-sm font-medium text-[#2D4A29]">Uploaded Successfully! Remember to save your changes!</p>
            </div>
          )}

          {uploading && (
            <div className="space-y-2 p-4 bg-white border border-gray-100 rounded-xl">
              <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                <span>Sending to Storage...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-gray-100" />
            </div>
          )}

          {!uploading && !uploadedUrl && (
            <Button
              type="button"
              className="w-full bg-[#5C9952] hover:bg-[#4a7c42] text-white font-bold h-12 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
            >
              Start Upload
            </Button>
          )}

          {uploadedUrl && !uploading && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl border-gray-200 font-bold"
                onClick={() => {
                  removeFile(0);
                }}
              >
                Change
              </Button>
              <Button
                type="button"
                className="flex-[2] bg-[#5C9952] hover:bg-[#4a7c42] text-white font-bold h-12 rounded-xl"
                onClick={() => onDone?.()}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  ) : (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm max-h-[50vh] overflow-y-auto">
          <ImageLibraryGrid 
            onSelect={(url) => {
              onUploadComplete?.(url);
              onDone?.(); // Auto-close parent context if available
            }}
          />
        </div>
      )}
    </div>
  );
}
