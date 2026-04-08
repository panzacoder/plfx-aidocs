import { useState, useCallback, useMemo, useEffect } from "react";
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
 * Uses the Convex agent's native thread management with optimistic updates
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
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch messages using the agent's query
  const agentMessages = useQuery(
    api.assistants.threads.listThreadMessages,
    threadId ? { threadId } : "skip"
  );

  const isMessagesLoading = agentMessages === undefined && threadId !== undefined;

  // Convert agent messages to our app's message format
  const persistedMessages: Message[] = useMemo(() => {
    if (!agentMessages) return [];
    
    return agentMessages.map(msg => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      creationTime: msg._creationTime || Date.now(),
      isStreaming: false
    }));
  }, [agentMessages]);

  // Combine persisted messages with optimistic updates
  const messages = useMemo(() => {
    const allMessages = [...persistedMessages, ...optimisticMessages];
    
    // Sort by creation time and remove duplicates
    return allMessages
      .sort((a, b) => a.creationTime - b.creationTime)
      .filter((msg, index, arr) => 
        index === arr.findIndex(m => m.id === msg.id || 
          (m.role === msg.role && Math.abs(m.creationTime - msg.creationTime) < 1000))
      );
  }, [persistedMessages, optimisticMessages]);

  // Actions for thread operations
  const createThreadAction = useAction(api.assistants.threads.createThread);
  const continueThreadAction = useAction(api.assistants.threads.continueThread);

  // Clear optimistic messages when new persisted messages arrive
  useEffect(() => {
    if (persistedMessages.length > 0 && optimisticMessages.length > 0) {
      // Remove optimistic messages that now exist in persisted messages
      setOptimisticMessages(prev => 
        prev.filter(optimistic => 
          !persistedMessages.some(persisted => 
            persisted.role === optimistic.role && 
            Math.abs(persisted.creationTime - optimistic.creationTime) < 5000
          )
        )
      );
    }
  }, [persistedMessages, optimisticMessages]);

  // Send a message with optimistic updates
  const sendMessage = useCallback(
    async (prompt: string, fileIds?: string[]) => {
      if (isActionLoading) return;
      
      setError(null);
      setIsActionLoading(true);

      // Add optimistic user message
      const optimisticUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content: prompt,
        creationTime: Date.now(),
        isStreaming: false
      };
      
      setOptimisticMessages(prev => [...prev, optimisticUserMessage]);

      // Add optimistic assistant message for better UX
      const optimisticAssistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: "...",
        creationTime: Date.now() + 1,
        isStreaming: true
      };

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
          // Add optimistic assistant message
          setOptimisticMessages(prev => [...prev, optimisticAssistantMessage]);
          
          // For existing threads, continue the conversation
          await continueThreadAction({
            threadId,
            prompt,
          });
        }
      } catch (err: any) {
        console.error("Error sending message:", err);
        setError(err.message || "Failed to send message");
        
        // Remove optimistic messages on error
        setOptimisticMessages(prev => 
          prev.filter(msg => 
            msg.id !== optimisticUserMessage.id && 
            msg.id !== optimisticAssistantMessage.id
          )
        );
      } finally {
        setIsActionLoading(false);
      }
    },
    [threadId, assistantId, createThreadAction, continueThreadAction, isActionLoading]
  );

  // Clear optimistic messages when thread changes
  useEffect(() => {
    setOptimisticMessages([]);
    setError(null);
  }, [threadId]);

  const isLoading = isMessagesLoading || isActionLoading;
  const isStreaming = optimisticMessages.some(msg => msg.isStreaming);

  return {
    threadId,
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
  };
}