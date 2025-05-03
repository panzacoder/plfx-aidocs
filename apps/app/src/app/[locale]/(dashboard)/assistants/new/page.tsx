"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { AssistantForm } from "../../../_components/assistants/assistant-form";
import { Skeleton } from "@v1/ui/skeleton";
import { Card, CardContent } from "@v1/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";

export default function NewAssistantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Get organizationId from URL or use first available
  const organizationIdFromUrl = searchParams.get('organizationId');
  
  // If organizationId is in URL, use it directly
  if (organizationIdFromUrl) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <AssistantForm organizationId={organizationIdFromUrl as Id<"organizations">} />
      </div>
    );
  }
  
  // Otherwise, fetch the first organization
  const organizationId = useQuery(api.organizations.queries.getFirstOrganization);

  // Show loading state while fetching
  if (organizationId === undefined) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle no organization
  if (!organizationId) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Organization Found</AlertTitle>
          <AlertDescription>
            You need to create an organization to get started.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <AssistantForm organizationId={organizationId} />
    </div>
  );
} 