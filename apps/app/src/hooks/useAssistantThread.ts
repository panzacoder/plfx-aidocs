import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useAssistantStream } from "./useAssistantStream";

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
  useAgent?: boolean;
}

export function useAssistantThread({ 
  assistantId, 
  initialThreadId,
  useAgent = true,
}: UseAssistantThreadProps) {
  const [threadId, setThreadId] = useState<string | initialThreadId>;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations
  const createThreadMutation = useMutation(api.assistants.threads.createThread);
  const continueThreadMutation = useMutation(api.assistants.threads.continueThread);
  
  // Legacy mutations (for non-agent assistants)
  const legacyCreateThread = useMutation(api.assistants.functions.createThread);
  const legacyContinueThread = useMutation(api.assistants.functions.continueThread);
  
  // Get messages from thread if threadId exists
  const threadMessages = useQuery(
    useAgent 
      ? api.assistants.threads.getMessages 
      : api.assistants.legacy.getMessages,
    threadId ? { threadId } : "skip"
  );
  
  // Setup streaming capability - only used with AI Agent
  const { 
    startStream, 
    text: streamingText, 
    isStreaming, 
    isComplete, 
    error: streamingError 
  } = useAssistantStream({
    onComplete: (finalText) => {
      // Only used when useAgent is true
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const streamingMessageIndex = updatedMessages.findIndex(m => m.isStreaming);
        
        if (streamingMessageIndex !== -1) {
          updatedMessages[streamingMessageIndex] = {
            ...updatedMessages[streamingMessageIndex],
            content: finalText,
            isStreaming: false
          };
        }
        
        return updatedMessages;
      });
    }
  });

  // Load messages from thread
  const loadMessages = useCallback(async () => {
    if (!threadId) return;
    
    try {
      if (threadMessages) {
        // Convert Convex format to our Message format
        const formattedMessages: Message[] = threadMessages.map((msg: any) => ({
          id: msg._id || msg.id,
          role: msg.role,
          content: msg.content,
          creationTime: msg._creationTime || msg.creationTime,
          isStreaming: false
        }));
        
        setMessages(formattedMessages);
      }
    } catch (err: any) {
      console.error("Error loading messages:", err);
      setError(err.message || "Failed to load messages");
    }
  }, [threadId, threadMessages]);

  // Send a message in a new or existing thread
  const sendMessage = useCallback(async (prompt: string, fileIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: prompt,
        creationTime: Date.now(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      if (!threadId) {
        if (useAgent) {
          // Create a new thread with the AI Agent
          const result = await createThreadMutation({ 
            assistantId, 
            prompt,
            fileIds 
          });
          
          setThreadId(result.threadId);
          
          // Add assistant's response
          const assistantMessage: Message = {
            id: result.messageId || `assistant-${Date.now()}`,
            role: "assistant",
            content: result.text,
            creationTime: Date.now(),
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Use legacy approach for non-agent assistants
          // This is just a stub - implement according to your legacy approach
          setError("Legacy assistant creation not implemented");
        }
      } else {
        if (useAgent) {
          // Add a placeholder for the streaming response
          const placeholderMessage: Message = {
            id: `streaming-${Date.now()}`,
            role: "assistant",
            content: "",
            creationTime: Date.now(),
            isStreaming: true
          };
          
          setMessages(prev => [...prev, placeholderMessage]);
          
          // Start streaming the response
          await startStream(threadId, prompt, assistantId);
        } else {
          // Use legacy approach for non-agent assistants
          // This is just a stub - implement according to your legacy approach
          setError("Legacy message continuation not implemented");
        }
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [threadId, assistantId, createThreadMutation, startStream, useAgent]);

  // Only update streaming content when using AI Agent
  if (useAgent && isStreaming && streamingText) {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      const streamingMessageIndex = updatedMessages.findIndex(m => m.isStreaming);
      
      if (streamingMessageIndex !== -1) {
        updatedMessages[streamingMessageIndex] = {
          ...updatedMessages[streamingMessageIndex],
          content: streamingText
        };
      }
      
      return updatedMessages;
    });
  }

  // Handle streaming errors
  if (streamingError && !error && useAgent) {
    setError(streamingError);
  }

  return {
    threadId,
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    loadMessages
  };
} 