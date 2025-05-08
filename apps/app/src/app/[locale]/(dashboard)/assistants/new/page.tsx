"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { AssistantForm } from "../../_components/assistants/assistant-form";
import { Skeleton } from "@v1/ui/skeleton";
import { Card, CardContent } from "@v1/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";
import { Loader2 } from "lucide-react";

export default function NewAssistantPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  // Get the current user's organization
  const organization = useQuery(api.organizations.functions.getUserOrganization);

  // Show loading state while fetching
  if (organization === undefined) {
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
  if (!organization || !organization._id) {
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

      <AssistantForm organizationId={organization._id} />
    </div>
  );
}
