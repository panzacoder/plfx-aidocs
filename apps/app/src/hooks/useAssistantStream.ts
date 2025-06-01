import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { useStreamText } from "@convex-dev/persistent-text-streaming/react";
import { Id } from "@v1/backend/convex/_generated/dataModel";

export interface UseAssistantStreamProps {
  onComplete?: (text: string) => void;
}

export function useAssistantStream(props?: UseAssistantStreamProps) {
  const { onComplete } = props || {};
  const [isStreaming, setIsStreaming] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use the Convex httpAction to initiate streaming
  const streamResponse = useAction(api.assistants.streaming.streamThreadResponse);
  
  // Use the persistent text streaming hook to consume the stream
  const { text, error: streamError, isComplete } = useStreamText(responseId);
  
  // Start streaming from a thread
  const startStream = async (
    threadId: string, 
    prompt: string, 
    assistantId: Id<"assistants">
  ): Promise<string> => {
    setIsStreaming(true);
    setError(null);
    
    try {
      // Call the HTTP endpoint to start streaming
      const response = await streamResponse({ threadId, prompt, assistantId });
      
      if (response.error) {
        setError(response.error);
        setIsStreaming(false);
        return "";
      }
      
      setResponseId(response.responseId);
      return response.responseId;
    } catch (err: any) {
      console.error("Failed to start streaming:", err);
      setError(err.message || "Failed to start streaming");
      setIsStreaming(false);
      return "";
    }
  };

  // Handle stream errors
  useEffect(() => {
    if (streamError) {
      setError(streamError);
      setIsStreaming(false);
    }
  }, [streamError]);

  // Handle stream completion
  useEffect(() => {
    if (isComplete && text) {
      setIsStreaming(false);
      if (onComplete) {
        onComplete(text);
      }
    }
  }, [isComplete, text, onComplete]);

  return {
    startStream,
    text: text || "",
    error: error,
    isStreaming,
    isComplete
  };
} 