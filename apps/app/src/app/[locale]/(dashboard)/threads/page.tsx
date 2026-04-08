"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import { Badge } from "@v1/ui/badge";
import { Skeleton } from "@v1/ui/skeleton";
import { MessageSquare, ChevronRight, Inbox } from "lucide-react";

export default function ThreadsPage() {
  const user = useQuery(api.users.functions.getUser);
  const org = useQuery(api.organizations.queries.getFirstOrganization);

  const assistants = useQuery(
    api.assistants.functions.listAssistants,
    org ? { organizationId: org._id } : "skip",
  );

  const [selectedAssistant, setSelectedAssistant] =
    useState<Id<"assistants"> | null>(null);

  const threads = useQuery(
    api.chat.functions.listThreads,
    selectedAssistant
      ? { assistantId: selectedAssistant }
      : "skip",
  );

  if (!user || !org) return null;

  return (
    <div className="flex h-full w-full flex-col gap-6 px-6 py-8">
      <div className="mx-auto w-full max-w-screen-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            Review chat threads from your published assistants
          </p>
        </div>

        {/* Assistant filter */}
        {assistants === undefined ? (
          <div className="mb-6 flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-32" />
            ))}
          </div>
        ) : assistants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
              <div className="text-center">
                <p className="font-medium">No assistants yet</p>
                <p className="text-sm text-muted-foreground">
                  Create an assistant from the Dashboard to start seeing
                  conversations.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={selectedAssistant === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAssistant(null)}
              >
                All
              </Button>
              {assistants.map((assistant) => (
                <Button
                  key={assistant._id}
                  variant={
                    selectedAssistant === assistant._id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedAssistant(assistant._id)}
                >
                  {assistant.name}
                  {assistant.isPublic && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      Live
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Threads list */}
            {selectedAssistant === null ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground/40" />
                  <div className="text-center">
                    <p className="font-medium">Select an assistant</p>
                    <p className="text-sm text-muted-foreground">
                      Choose an assistant above to view its conversation threads.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : threads === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-96" />
                        </div>
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
                  <div className="text-center">
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm text-muted-foreground">
                      Conversations will appear here once users start chatting
                      with your assistant.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {threads.map((thread: any, i: number) => (
                  <Card
                    key={thread.id ?? i}
                    className="cursor-pointer transition hover:bg-muted/50"
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          Thread #{thread.id ?? i + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {thread.messageCount
                            ? `${thread.messageCount} messages`
                            : "No messages yet"}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
