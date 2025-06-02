import { useState, useCallback, useEffect } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useThreadMessages } from "@convex-dev/agent/react";
import { useSmoothText } from "@convex-dev/agent/react";

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

export function useAssistantThread({ 
  assistantId, 
  initialThreadId,
}: UseAssistantThreadProps) {
  const [threadId, setThreadId] = useState<string | undefined>(initialThreadId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Convex Agent's thread messages hook with streaming enabled
  const { 
    messages: agentMessages, 
    isLoading: isMessagesLoading, 
    isStreaming 
  } = useThreadMessages(
    api.assistants.threads.getMessages,
    threadId ? { threadId } : "skip",
    { stream: true }
  );

  // Convert agent messages to our app's format
  const messages = agentMessages?.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    creationTime: msg._creationTime || Date.now(),
    isStreaming: msg.isStreaming
  })) || [];

  // Actions for thread management
  const createThreadAction = useAction(api.assistants.threads.createThread);
  const continueThreadAction = useAction(api.assistants.streaming.generateAgentStreamingResponse);

  // Send a message in a new or existing thread
  const sendMessage = useCallback(async (prompt: string, fileIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!threadId) {
        // Create a new thread
        const result = await createThreadAction({ 
          assistantId, 
          prompt,
          fileIds 
        });
        
        setThreadId(result.threadId);
      } else {
        // Continue existing thread with streaming
        await continueThreadAction({
          threadId,
          prompt,
          assistantId
        });
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [threadId, assistantId, createThreadAction, continueThreadAction]);

  return {
    threadId,
    messages,
    isLoading: isLoading || isMessagesLoading,
    isStreaming,
    error,
    sendMessage
  };
}

/**
 * Legacy hook for backward compatibility during migration
 * @deprecated Use useAssistantThread instead
 */
export function useLegacyAssistantThread(props: UseAssistantThreadProps) {
  console.warn("useLegacyAssistantThread is deprecated. Use useAssistantThread instead.");
  return useAssistantThread(props);
}