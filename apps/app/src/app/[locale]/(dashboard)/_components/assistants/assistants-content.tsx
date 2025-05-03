"use client";

import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { AssistantsList } from "./assistants-list";
import { AssistantsListSkeleton } from "./assistants-list-skeleton";

export function AssistantsContent() {
  const organizationId = useQuery(
    api.organizations.queries.getFirstOrganization,
  );

  // Loading state
  if (organizationId === undefined) {
    return <AssistantsListSkeleton />;
  }

  // No organization yet
  if (!organizationId) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h3 className="mb-2 text-lg font-medium">No Organization Found</h3>
        <p className="text-muted-foreground mb-4">
          You need to create an organization to get started.
        </p>
        {/* We'll add a button here in the future to create an organization if necessary */}
      </div>
    );
  }

  // Since we're bypassing AI provider checks, directly show assistants for the organization
  return <AssistantsList organizationId={organizationId} />;
}
