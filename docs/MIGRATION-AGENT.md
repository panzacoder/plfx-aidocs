# Migration Plan: Custom AI Assistant to Convex Agent

This document outlines the plan to migrate our custom AI assistant solution to the pre-built Convex agent component. The migration focuses on code changes without need for data migration, as we have no real users or data yet.

## Overview

Current implementation:
- Custom AI assistant solution using OpenAI
- Self-built streaming capability
- Custom thread and message management
- File storage and retrieval

Target implementation:
- Pre-built [Convex agent component](https://github.com/get-convex/agent)
- Built-in persistence and message management
- Built-in streaming capabilities
- Improved context handling and RAG capabilities

## Migration Steps

### 1. Installation and Configuration

```bash
# Install the Convex agent package
npm install @convex-dev/agent
```

Add the agent to your Convex configuration:

```typescript
// In packages/backend/convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);
export default app;
```

### 2. Backend Changes

#### 2.1 Schema Updates

- Keep the existing `assistants` table with small modifications
- Remove custom thread and message tables - the agent will handle these

Update the assistants schema (`packages/backend/convex/assistants/schema.ts`):

```typescript
// Add any additional fields needed for Convex agent
export const assistants = {
  // Existing fields...
  externalAgentId: z.string().optional(), // Reference to agent thread ID if needed
  // Remove agentEnabled field since all assistants will use the agent
};
```

#### 2.2 Agent Creation

Replace the custom `createAssistantAgent` function (`packages/backend/convex/assistants/agent.ts`) with the Convex Agent implementation:

```typescript
import { openai } from "@ai-sdk/openai";
import { Agent, createTool } from "@convex-dev/agent";
import { components } from "../_generated/api";

// Define tools similar to existing searchDocuments tool
const searchDocuments = createTool({
  // Similar implementation as before
  description: "Search organization documents by query...",
  args: z.object({
    query: z.string().describe("The search query"),
    limit: z.number().optional().describe("The maximum number of results to return"),
  }),
  handler: async (ctx, args) => {
    // Implement search functionality
    // ...
  },
});

export function createConvexAgent(
  apiKey: string,
  model: string = "gpt-4o",
  instructions?: string,
) {
  return new Agent(components.agent, {
    chat: openai.chat(model as any, { apiKey }),
    textEmbedding: openai.embedding("text-embedding-3-small", { apiKey }),
    instructions: instructions || "You are a helpful assistant.",
    tools: { searchDocuments },
    contextOptions: {
      includeToolCalls: true,
      recentMessages: 10,
      searchOtherThreads: false,
      searchOptions: {
        limit: 20,
        textSearch: true,
        vectorSearch: true,
        messageRange: { before: 2, after: 1 },
      },
    },
  });
}
```

#### 2.3 Thread Management

Replace the custom thread management (`packages/backend/convex/assistants/threads.ts`) with Convex Agent thread functions:

```typescript
import { v } from "convex/values";
import { action, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { createConvexAgent } from "./agent";

export const createThread = action({
  args: {
    assistantId: v.id("assistants"),
    prompt: v.string(),
    fileIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get assistant details
    const assistant = await ctx.runQuery(internal.assistants.functions.getAssistant, {
      assistantId: args.assistantId,
    });
    if (!assistant) throw new Error("Assistant not found");

    // Get API key
    let apiKey = "";
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      apiKey = provider?.apiKey || "";
    }

    // Create agent instance
    const agent = createConvexAgent(apiKey, assistant.model, assistant.instructions);

    // Create thread with the agent
    const { threadId, thread } = await agent.createThread(ctx, {
      userId: userId.toString(),
      metadata: {
        assistantId: args.assistantId.toString(),
        organizationId: assistant.organizationId.toString(),
        fileIds: args.fileIds || assistant.fileIds || [],
      },
    });

    // Generate initial response
    const result = await thread.generateText({
      prompt: args.prompt,
      contextMessages: assistant.initialPrompt
        ? [{ role: "assistant", content: assistant.initialPrompt }]
        : undefined,
    });

    return {
      threadId,
      messageId: result.messageId,
      text: result.text,
    };
  },
});

export const continueThread = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get thread metadata
    const threadInfo = await ctx.runQuery(internal.agent.messages.getThreadMetadata, {
      threadId: args.threadId,
    });

    if (!threadInfo) throw new Error("Thread not found");

    // Get assistant from metadata
    const assistantId = threadInfo?.metadata?.assistantId;
    if (!assistantId) throw new Error("No assistant ID in thread metadata");

    const assistant = await ctx.runQuery(internal.assistants.functions.getAssistant, {
      assistantId,
    });
    if (!assistant) throw new Error("Assistant not found");

    // Get API key
    let apiKey = "";
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      apiKey = provider?.apiKey || "";
    }

    // Create agent
    const agent = createConvexAgent(apiKey, assistant.model, assistant.instructions);

    // Continue thread
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: userId.toString(),
    });

    // Generate response
    const result = await thread.generateText({ prompt: args.prompt });

    return {
      messageId: result.messageId,
      text: result.text,
    };
  },
});

export const getMessages = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.runQuery(internal.agent.messages.getThreadMessages, {
      threadId: args.threadId,
    });
  },
});

export const listThreads = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get threads with specific organization metadata
    return await ctx.runQuery(internal.agent.messages.searchThreadsForUser, {
      userId: userId.toString(),
      metadataFilter: {
        organizationId: args.organizationId.toString(),
      },
      limit: args.limit || 10,
      cursor: args.cursor,
    });
  },
});
```

#### 2.4 Streaming Implementation

Update the streaming implementation (`packages/backend/convex/assistants/streaming.ts`) to use Convex Agent's built-in streaming:

```typescript
import { v } from "convex/values";
import { action, httpAction } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { createConvexAgent } from "./agent";

export const generateStreamingResponse = action({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get assistant details
    const assistant = await ctx.runQuery(internal.assistants.functions.getAssistant, {
      assistantId: args.assistantId,
    });
    if (!assistant) throw new Error("Assistant not found");

    // Get API key
    let apiKey = "";
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      apiKey = provider?.apiKey || "";
    }

    // Create agent
    const agent = createConvexAgent(apiKey, assistant.model, assistant.instructions);

    // Continue thread with the agent
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: userId.toString(),
    });

    // Generate streaming response
    return await thread.generateText({
      prompt: args.prompt,
      stream: true,
    });
  },
});

// Maintain compatibility with existing streaming API for backward compatibility
export const streamThreadResponse = httpAction(async (ctx, request) => {
  // Parse request body
  const body = await request.json();
  const { threadId, prompt, assistantId } = body;
  
  if (!threadId || !prompt || !assistantId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Schedule streaming generation using the Convex Agent
    const result = await ctx.runAction(internal.assistants.streaming.generateStreamingResponse, {
      threadId,
      prompt,
      assistantId,
    });

    // Return the stream ID for the client to consume
    return new Response(JSON.stringify({ responseId: result.streamId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error initiating stream:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
```

### 3. Frontend Changes

#### 3.1 Update Hooks

Replace `useAssistantThread` and `useAssistantStream` hooks with Convex Agent hooks:

```typescript
// apps/app/src/hooks/useAssistantThread.ts
import { useCallback, useState } from "react";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { api } from "@v1/backend/convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { useThreadMessages } from "@convex-dev/agent/react";

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

  // Use the Convex Agent hooks
  const { messages, isStreaming } = useThreadMessages(
    api.assistants.threads.getMessages,
    threadId ? { threadId } : "skip",
    { stream: true }
  );
  
  const createThreadMutation = useAction(api.assistants.threads.createThread);
  const continueThreadAction = useAction(api.assistants.threads.generateStreamingResponse);

  const sendMessage = useCallback(async (prompt: string, fileIds?: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!threadId) {
        // Create new thread
        const result = await createThreadMutation({
          assistantId,
          prompt,
          fileIds,
        });
        
        setThreadId(result.threadId);
      } else {
        // Continue existing thread
        await continueThreadAction({
          threadId,
          prompt,
          assistantId,
        });
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [threadId, assistantId, createThreadMutation, continueThreadAction]);

  return {
    threadId,
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
  };
}
```

#### 3.2 Update Chat Interface

Update the chat interface component to use the new hooks:

```typescript
// apps/app/src/components/assistants/chat-interface.tsx
import { useState, useRef, useEffect } from "react";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useAssistantThread } from "@/hooks/useAssistantThread";
import { useSmoothText } from "@convex-dev/agent/react"; // Import smooth text hook
// ... other imports

export interface ChatInterfaceProps {
  assistantId: Id<"assistants">;
  assistantName?: string;
  initialThreadId?: string;
  disclaimer?: string;
  className?: string;
}

export function ChatInterface({
  assistantId,
  assistantName = "Assistant",
  initialThreadId,
  disclaimer,
  className,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    threadId,
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
  } = useAssistantThread({
    assistantId,
    initialThreadId,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input field when component loads
  useEffect(() => {
    if (!initialThreadId) {
      inputRef.current?.focus();
    }
  }, [initialThreadId]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isStreaming) return;
    
    await sendMessage(input);
    setInput("");
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render messages with smooth text for streaming
  const renderMessage = (message) => {
    const isUser = message.role === "user";
    
    // Apply smooth text effect to assistant messages
    const content = isUser 
      ? message.content 
      : useSmoothText(message.content, message.isStreaming);
    
    return (
      <div 
        key={message.id}
        className={cn(
          "flex w-full mb-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {/* Message rendering UI... */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown>{content}</Markdown>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)}>
      {/* Card Header */}
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">{assistantName}</CardTitle>
      </CardHeader>
      
      {/* Card Content - Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        {/* Disclaimer */}
        {disclaimer && messages.length === 0 && (
          <div className="mb-4 p-3 text-sm bg-muted rounded-lg">
            {disclaimer}
          </div>
        )}
        
        {/* Chat messages */}
        <div className="space-y-4">
          {messages.map(renderMessage)}
          
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg mb-4">
              Error: {error}
            </div>
          )}
          
          {/* Loading indicator when thread is loading but not streaming */}
          {isLoading && !isStreaming && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {/* For auto-scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      {/* Card Footer - Input */}
      <CardFooter className="p-4 border-t">
        <div className="flex w-full items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
            disabled={isLoading || isStreaming}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || isStreaming}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### 4. Form Updates

Update the assistant creation form to match the Convex Agent requirements:

```typescript
// apps/app/src/app/[locale]/(dashboard)/_components/assistants/assistant-form.tsx
// Update form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  model: z.enum(["gpt-4o", "gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]), // Update available models
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])),
  // Remove agentEnabled flag since all assistants will use the agent
});

// Rest of the form component remains similar, just remove the agentEnabled field
export function AssistantForm({ organizationId, assistant }: AssistantFormProps) {
  // ...existing component code
  
  // Remove the agentEnabled watch and related UI
  const mode = form.watch("mode");
  
  // ...rest of the component
}
```

### 5. Testing Plan

1. Create a new assistant using the updated form
2. Test basic chat functionality
3. Test streaming responses
4. Test file uploads and retrieval
5. Test context handling and memory
6. Verify handling of restricted mode
7. Test across multiple browsers and devices

### 6. Final Cleanup

1. Remove any unused code from the legacy implementation:
   - Remove legacy API handlers for non-agent assistants
   - Clean up unused schema fields
   - Remove unused streaming code

2. Update documentation to reflect the new implementation

3. Add monitoring for potential issues:
   - Add logging for agent failures
   - Monitor performance metrics

## Benefits of Migration

1. **Built-in Persistence**: Leverage Convex's built-in thread and message storage
2. **Improved Streaming**: More reliable and efficient streaming implementation
3. **Advanced Context**: Better handling of conversation context and history
4. **Simplified Codebase**: Reduction in custom code and maintenance burden
5. **Future Updates**: Benefit from ongoing updates to the Convex Agent framework

## Timeline Estimate

- Backend updates: 2-3 days
- Frontend updates: 2-3 days
- Testing and refinement: 1-2 days
- Final cleanup: 1 day

Total estimated time: 1-2 weeks