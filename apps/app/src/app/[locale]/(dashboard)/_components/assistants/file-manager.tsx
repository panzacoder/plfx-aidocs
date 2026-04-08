"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useDropzone } from "react-dropzone";
import { Button } from "@v1/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import {
  UploadCloud,
  File,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@v1/ui/use-toast";
import { Progress } from "@v1/ui/progress";
import { Badge } from "@v1/ui/badge";
import { Skeleton } from "@v1/ui/skeleton";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

interface FileManagerProps {
  assistantId: Id<"assistants">;
}

export function FileManager({ assistantId }: FileManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<
    Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      progress: number;
      status: "preparing" | "uploading" | "processing" | "error" | "success";
      error?: string;
    }>
  >([]);

  const files = useQuery(api.files.functions.listFiles, { assistantId });
  const getUploadUrl = useMutation(api.files.functions.getUploadUrl);
  const processUploadedFile = useMutation(
    api.files.functions.processUploadedFile,
  );
  const deleteFile = useMutation(api.files.functions.deleteFile);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const uploadId = Math.random().toString(36).substring(2, 15);

        setUploads((prev) => [
          ...prev,
          {
            id: uploadId,
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: "preparing",
          },
        ]);

        try {
          // Get upload URL from Convex storage
          const { uploadUrl } = await getUploadUrl({
            assistantId,
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          });

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "uploading" } : u,
            ),
          );

          // Upload to Convex storage via POST
          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
          }

          const { storageId } = await uploadResponse.json();

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? { ...u, progress: 100, status: "processing" }
                : u,
            ),
          );

          // Create file record and trigger RAG ingestion
          await processUploadedFile({
            assistantId,
            storageId,
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          });

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "success" } : u,
            ),
          );

          toast({
            title: "File uploaded",
            description: `${file.name} is being processed for your assistant.`,
          });
        } catch (error: any) {
          console.error("Error uploading file:", error);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? {
                    ...u,
                    status: "error",
                    error: error.message || "Upload failed",
                  }
                : u,
            ),
          );
        }
      }
    },
    [assistantId, getUploadUrl, processUploadedFile, toast],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/html": [".html", ".htm"],
      "text/csv": [".csv"],
      "application/json": [".json"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
      "application/rtf": [".rtf"],
    },
  });

  const handleDeleteFile = async (fileId: Id<"files">) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteFile({ fileId });
      toast({
        title: "File deleted",
        description: "The file has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex w-full flex-col space-y-6">
      <Card>
        <CardHeader>
          <Button
            variant="ghost"
            className="mb-2 w-fit p-0 hover:bg-transparent"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Upload documents to build your assistant's knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors hover:bg-secondary/20 ${
              isDragActive ? "border-primary bg-secondary/20" : "border-border"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mb-4 h-12 w-12 text-primary/60" />
            <p className="mb-2 text-center font-medium">
              {isDragActive
                ? "Drop files here..."
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              PDF, TXT, CSV, JSON, HTML, MD, DOCX, DOC, RTF up to 20MB
            </p>
          </div>

          {/* Active uploads */}
          {uploads.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Uploads</h3>
              <div className="space-y-3">
                {uploads.map((upload) => (
                  <Card key={upload.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <div className="flex items-start gap-3">
                          <File className="h-5 w-5 text-primary/60" />
                          <div className="flex flex-col">
                            <span className="font-medium">{upload.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatBytes(upload.size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {upload.status === "processing" && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
                          )}
                          {upload.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                          {upload.status === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <button
                            onClick={() =>
                              setUploads((prev) =>
                                prev.filter((f) => f.id !== upload.id),
                              )
                            }
                            className="rounded-full p-1 hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {upload.status === "uploading" && (
                        <Progress value={upload.progress} className="mt-2 h-1" />
                      )}
                      {upload.status === "error" && (
                        <p className="mt-2 text-sm text-destructive">
                          {upload.error}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Existing files */}
          {files === undefined ? (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Documents</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-5 w-5" />
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : files.length > 0 ? (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Documents</h3>
              <div className="space-y-3">
                {files.map((file) => (
                  <Card key={file._id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <div className="flex items-start gap-3">
                          <File className="h-5 w-5 text-primary/60" />
                          <div className="flex flex-col">
                            <span className="font-medium">{file.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              file.status === "ready"
                                ? "default"
                                : file.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="px-2 py-1 text-xs"
                          >
                            {file.status}
                          </Badge>
                          <button
                            onClick={() => handleDeleteFile(file._id)}
                            className="rounded-full p-1 hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">
                No documents uploaded yet. Upload files to build your
                assistant's knowledge base.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.back()}>
            Done
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
