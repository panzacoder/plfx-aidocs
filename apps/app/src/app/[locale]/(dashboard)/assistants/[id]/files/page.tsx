"use client";

import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { FileManager } from "../../../../_components/assistants/file-manager";
import { Skeleton } from "@v1/ui/skeleton";
import { Card, CardContent } from "@v1/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";

export default function AssistantFilesPage({ params }: { params: { id: string } }) {
  const assistantId = params.id as Id<"assistants">;
  
  // Verify the assistant exists
  const assistant = useQuery(api.assistants.functions.getAssistant, { 
    assistantId 
  });

  // Show loading state while fetching
  if (assistant === undefined) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-full" />
              <div className="mt-6">
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle not found
  if (!assistant) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Assistant not found. It may have been deleted.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <FileManager assistantId={assistantId} />
    </div>
  );
} 