"use client";

import { useRouter } from "next/navigation";
import { Button } from "@v1/ui/button";
import { Card } from "@v1/ui/card";
import { Plus } from "lucide-react";
import { Id } from "@v1/backend/convex/_generated/dataModel";

interface CreateAssistantCardProps {
  organizationId: Id<"organizations">;
}

export function CreateAssistantCard({ organizationId }: CreateAssistantCardProps) {
  const router = useRouter();
  
  return (
    <Card className="flex h-60 flex-col items-center justify-center border-dashed">
      <Button
        variant="ghost"
        className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg"
        onClick={() => router.push(`/assistants/new?organizationId=${organizationId}`)}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border">
          <Plus className="h-6 w-6 text-primary/60" />
        </div>
        <span className="text-sm font-medium text-primary/60">Create New Assistant</span>
      </Button>
    </Card>
  );
} 