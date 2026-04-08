"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@v1/ui/card";
import { Badge } from "@v1/ui/badge";
import { useToast } from "@v1/ui/use-toast";
import { Settings, File, CircleX, Globe, GlobeLock } from "lucide-react";

interface AssistantCardProps {
  assistant: {
    _id: Id<"assistants">;
    name: string;
    description?: string;
    model: string;
    status: string;
    isPublic: boolean;
    mode: string;
  };
}

export function AssistantCard({ assistant }: AssistantCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const deleteAssistant = useMutation(
    api.assistants.functions.deleteAssistant,
  );

  function getStatusColor(status: string) {
    switch (status) {
      case "ready":
        return "bg-green-500/10 text-green-600 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400";
      case "draft":
        return "bg-yellow-500/10 text-yellow-600 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "error":
        return "bg-red-500/10 text-red-600 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-600 ring-gray-600/20 dark:bg-gray-900/20 dark:text-gray-400";
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this assistant?")) return;
    try {
      await deleteAssistant({ assistantId: assistant._id });
      toast({
        title: "Assistant deleted",
        description: "The assistant has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assistant.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card
      className="relative overflow-hidden transition-shadow hover:shadow-md"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg">
            {assistant.name || "Unnamed Assistant"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {assistant.isPublic ? (
              <Globe className="h-4 w-4 text-green-600" />
            ) : (
              <GlobeLock className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge
              className={`${getStatusColor(assistant.status)} px-2 py-1 text-xs`}
            >
              {assistant.status}
            </Badge>
          </div>
        </div>
        <CardDescription className="line-clamp-1">
          {assistant.description || "No description provided"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-medium">Model:</span>
            <span>{assistant.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Mode:</span>
            <span className="capitalize">{assistant.mode}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/assistants/${assistant._id}`)}
        >
          <Settings className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/assistants/${assistant._id}/files`)}
        >
          <File className="mr-2 h-4 w-4" />
          Files
        </Button>
      </CardFooter>

      {isHovering && (
        <div className="absolute right-2 top-2">
          <button
            className="rounded-full p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Delete assistant"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>
      )}
    </Card>
  );
}
