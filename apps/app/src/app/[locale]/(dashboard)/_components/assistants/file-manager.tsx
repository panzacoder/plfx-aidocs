"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useDropzone } from "react-dropzone";
import { Button } from "@v1/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@v1/ui/card";
import { UploadCloud, File, X, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@v1/ui/use-toast";
import { Progress } from "@v1/ui/progress";
import { Badge } from "@v1/ui/badge";
import { Skeleton } from "@v1/ui/skeleton";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileManagerProps {
  assistantId: Id<"assistants">;
}

export function FileManager({ assistantId }: FileManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number;
    status: "preparing" | "uploading" | "processing" | "error" | "success";
    error?: string;
    fileId?: Id<"files">;
  }>>([]);

  const files = useQuery(api.files.functions.listFiles, { assistantId });
  const getUploadUrl = useMutation(api.files.functions.getUploadUrl);
  const processUploadedFile = useMutation(api.files.functions.processUploadedFile);
  const deleteFile = useMutation(api.files.functions.deleteFile);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const maxFileSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/html",
        "text/csv",
        "application/json",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "application/rtf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      for (const file of acceptedFiles) {
        // Generate a unique ID for this upload
        const uploadId = Math.random().toString(36).substring(2, 15);

        // Check file size
        if (file.size > maxFileSize) {
          setUploads((prev) => [
            ...prev,
            {
              id: uploadId,
              name: file.name,
              size: file.size,
              type: file.type,
              progress: 0,
              status: "error",
              error: `File is too large. Maximum size is ${formatBytes(maxFileSize)}.`,
            },
          ]);
          continue;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          setUploads((prev) => [
            ...prev,
            {
              id: uploadId,
              name: file.name,
              size: file.size,
              type: file.type,
              progress: 0,
              status: "error",
              error: "File type not supported.",
            },
          ]);
          continue;
        }

        // Add file to uploads with 'preparing' status
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
          // Get upload URL from Convex
          const { uploadUrl, fileId } = await getUploadUrl({
            assistantId,
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          });

          // Update status to 'uploading'
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId
                ? { ...upload, status: "uploading", fileId }
                : upload
            )
          );

          // Upload the file to Convex Storage
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploads((prev) =>
                prev.map((upload) =>
                  upload.id === uploadId ? { ...upload, progress } : upload
                )
              );
            }
          };

          xhr.onload = async () => {
            if (xhr.status === 200) {
              // File uploaded successfully, update status to 'processing'
              setUploads((prev) =>
                prev.map((upload) =>
                  upload.id === uploadId
                    ? { ...upload, progress: 100, status: "processing" }
                    : upload
                )
              );

              // Process the file (upload to OpenAI)
              await processUploadedFile({ fileId });

              // Update status to 'success'
              setUploads((prev) =>
                prev.map((upload) =>
                  upload.id === uploadId
                    ? { ...upload, status: "success" }
                    : upload
                )
              );

              toast({
                title: "File uploaded successfully",
                description: `${file.name} has been uploaded and is being processed.`,
              });

              // Refresh the file list
              setTimeout(() => {
                router.refresh();
              }, 5000);
            } else {
              throw new Error(`Upload failed with status ${xhr.status}`);
            }
          };

          xhr.onerror = () => {
            setUploads((prev) =>
              prev.map((upload) =>
                upload.id === uploadId
                  ? {
                      ...upload,
                      status: "error",
                      error: "An error occurred during upload",
                    }
                  : upload
              )
            );
          };

          xhr.send(file);
        } catch (error) {
          console.error("Error uploading file:", error);
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId
                ? {
                    ...upload,
                    status: "error",
                    error: error.message || "An error occurred",
                  }
                : upload
            )
          );
        }
      }
    },
    [assistantId, getUploadUrl, processUploadedFile, toast, router]
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
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "application/rtf": [".rtf"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  });

  const handleDeleteFile = async (fileId: Id<"files">) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile({ fileId });
        toast({
          title: "File deleted",
          description: "The file has been removed from your assistant.",
        });
        router.refresh();
      } catch (error) {
        console.error("Error deleting file:", error);
        toast({
          title: "Error",
          description: "Failed to delete file. Please try again.",
          variant: "destructive",
        });
      }
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
          <CardTitle>File Manager</CardTitle>
          <CardDescription>
            Upload and manage files for your AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                : "Drag & drop files here, or click to select files"}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Supports PDF, TXT, CSV, JSON, HTML, MD, DOCX, DOC, RTF, PPT, PPTX up to 20MB
            </p>
          </div>

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
                          {upload.status === "uploading" && (
                            <span className="text-xs text-muted-foreground">
                              {upload.progress}%
                            </span>
                          )}
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
                                prev.filter((f) => f.id !== upload.id)
                              )
                            }
                            className="rounded-full p-1 hover:bg-muted"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {upload.status === "uploading" && (
                        <Progress
                          value={upload.progress}
                          className="mt-2 h-1"
                        />
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

          {files === undefined ? (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Files</h3>
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
              <h3 className="font-medium">Files</h3>
              <div className="space-y-3">
                {files.map((file) => (
                  <Card key={file._id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between">
                        <div className="flex items-start gap-3">
                          <File className="h-5 w-5 text-primary/60" />
                          <div className="flex flex-col">
                            <span className="font-medium">{file.name}</span>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                              <span>{formatBytes(file.size)}</span>
                              <span>•</span>
                              <span>
                                {formatDate(new Date(file.lastUpdated))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              file.status === "ready"
                                ? "success"
                                : file.status === "failed"
                                ? "destructive"
                                : "default"
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
                No files uploaded yet. Upload some files to enhance your assistant's knowledge.
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