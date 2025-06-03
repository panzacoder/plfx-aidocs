import { useState, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";

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
 * 
 * @param props Configuration options
 * @returns Thread state and message management functions
 */
export function useAssistantThread({
  assistantId,
  initialThreadId,
}: UseAssistantThreadProps) {
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages using standard Convex query
  const agentMessages = useQuery(
    api.assistants.threads.listThreadMessages,
    threadId ? { threadId } : "skip"
  );
  
  const isMessagesLoading = agentMessages === undefined && threadId !== undefined;
  const [isStreaming, setIsStreaming] = useState(false);

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
          // For existing threads, generate a streaming response
          setIsStreaming(true);
          await generateResponseAction({
            threadId,
            prompt,
            assistantId,
          });
          setIsStreaming(false);
        }
      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
      }
    },
    [threadId, assistantId, createThreadAction, generateResponseAction]
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