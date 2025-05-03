"use client";

import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { AssistantCard } from "./assistant-card";
import { AssistantsListSkeleton } from "./assistants-list-skeleton";
import { CreateAssistantCard } from "./create-assistant-card";
import { AssistantDoc } from "@v1/backend/convex/_generated/dataModel";

interface AssistantsListProps {
  organizationId: Id<"organizations">;
}

export function AssistantsList({ organizationId }: AssistantsListProps) {
  const assistants = useQuery(api.assistants.functions.listAssistants, { organizationId });
  
  if (assistants === undefined) {
    return <AssistantsListSkeleton />;
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {assistants.map((assistant: AssistantDoc) => (
        <AssistantCard key={assistant._id} assistant={assistant} />
      ))}
      
      <CreateAssistantCard organizationId={organizationId} />
    </div>
  );
} 