"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssistantDoc } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@v1/ui/card";
import { Badge } from "@v1/ui/badge";
import { Settings, File, CircleX, RefreshCw } from "lucide-react";

interface AssistantCardProps {
  assistant: AssistantDoc;
}

export function AssistantCard({ assistant }: AssistantCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();
  
  function getStatusColor(status: string) {
    switch (status) {
      case "ready":
        return "bg-green-500/10 text-green-600 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400";
      case "creating":
        return "bg-blue-500/10 text-blue-600 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400";
      case "failed":
        return "bg-red-500/10 text-red-600 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-600 ring-gray-600/20 dark:bg-gray-900/20 dark:text-gray-400";
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
          <CardTitle className="text-lg">{assistant.name || "Unnamed Assistant"}</CardTitle>
          <Badge className={`${getStatusColor(assistant.status)} px-2 py-1 text-xs`}>
            {assistant.status}
          </Badge>
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
            <span className="font-medium">Files:</span>
            <span>{assistant.fileIds?.length || 0}</span>
          </div>
          <div className="flex flex-wrap gap-1 pt-2">
            {assistant.tools?.map((tool: string) => (
              <Badge key={tool} variant="outline" className="text-xs">
                {tool}
              </Badge>
            ))}
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
      
      {isHovering && assistant.status === "failed" && (
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            className="rounded-full p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this assistant?")) {
                // Delete logic
              }
            }}
          >
            <CircleX className="h-5 w-5" />
          </button>
          <button
            className="rounded-full p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20"
            title="Retry"
            onClick={(e) => {
              e.stopPropagation();
              // Sync logic
            }}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      )}
    </Card>
  );
} 