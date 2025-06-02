import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useThreadMessages } from "@convex-dev/agent/react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  creationTime: number;
  isStreaming?: boolean;
}

export interface UseAssistantThreadProps {
  assistantId: Id<"assistants">;
  initialThreadId?: string;
}

/**
 * Hook for managing assistant conversation threads
 * Uses the Convex agent's built-in message handling and streaming
 */
export function useAssistantThread({
  assistantId,
  initialThreadId,
}: UseAssistantThreadProps) {
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [error, setError] = useState<string | null>(null);

  // Use the agent's built-in hooks with streaming enabled
  const {
    messages: agentMessages,
    isLoading: isMessagesLoading,
    isStreaming,
    optimisticallySendMessage,
  } = useThreadMessages(
    api.assistants.threads.listThreadMessages,
    threadId ? { threadId } : "skip",
    { stream: true }
  );

  // Convert agent messages to our app's message format
  const messages: Message[] = agentMessages?.map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
    creationTime: msg._creationTime || Date.now(),
    isStreaming: msg.isStreaming
  })) || [];

  // Actions for thread operations
  const createThreadAction = useAction(api.assistants.threads.createThread);
  const generateResponseAction = useAction(api.assistants.streaming.generateStreamingResponse);

  // Send a message in a new or existing thread
  const sendMessage = useCallback(
    async (prompt: string, fileIds?: string[]) => {
      setError(null);

      try {
        if (!threadId) {
          // Create a new thread
          const result = await createThreadAction({
            assistantId,
            prompt,
            fileIds,
          });
          setThreadId(result.threadId);
        } else {
          // For existing threads, use optimistic updates
          // This immediately shows the user message and streams the response
          optimisticallySendMessage(
            {
              threadId,
              content: prompt,
              role: "user",
            },
            {
              // Parameters for generateStreamingResponse action
              threadId,
              prompt,
              assistantId,
            }
          );
        }
      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
      }
    },
    [threadId, assistantId, createThreadAction, optimisticallySendMessage]
  );

  const isLoading = isMessagesLoading || false;

  return {
    threadId,
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
  };
}

/**
 * Legacy hook for backward compatibility during migration
 * @deprecated Use useAssistantThread instead
 */
export function useLegacyAssistantThread(props: UseAssistantThreadProps & { useAgent?: boolean }) {
  console.warn("useLegacyAssistantThread is deprecated. Use useAssistantThread instead.");
  return useAssistantThread(props);
}