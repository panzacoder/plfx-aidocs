# Comprehensive Convex Agent Migration Plan

This document outlines a detailed plan for fully integrating the Convex agent component into our application. This plan focuses on leveraging the native capabilities of the Convex agent for better performance, maintainability, and alignment with best practices.

## Phase 1: Backend Restructuring

### 1.1 Create Centralized Agent Configuration

**File:** `/packages/backend/convex/agents.ts`

```typescript
import { Agent, createTool } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "./_generated/api";
import { internal } from "./_generated/api";

// Document search tool (migrated from existing implementation)
const searchDocuments = createTool({
  description: "Search organization documents by query.",
  args: z.object({
    query: z.string().describe("The search query"),
    limit: z.number().optional().describe("The maximum number of results to return"),
  }),
  handler: async (ctx, args) => {
    // Implementation migrated from current code
    const assistant = await ctx.db.get(ctx.assistantId);
    if (!assistant) return "Assistant not found.";
    
    const results = await ctx.runQuery(internal.files.search.searchFiles, {
      organizationId: assistant.organizationId,
      query: args.query,
      limit: args.limit || 5,
    });
    
    // Format and return results (same as current implementation)
    // ...
  },
});

// Define a centralized assistant agent configuration
export const assistantAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o"),
  textEmbedding: openai.embedding("text-embedding-3-small"),
  instructions: "You are a helpful assistant.",
  tools: { 
    searchDocuments,
    // Add additional tools as needed
  },
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
  storageOptions: {
    saveAllInputMessages: true,
    saveOutputMessages: true,
  },
  maxSteps: 10,
  usageHandler: async (ctx, args) => {
    // Usage tracking logic (migrated from current implementation)
    console.log("Token usage:", {
      userId: args.userId,
      threadId: args.threadId,
      model: args.model,
      provider: args.provider,
      usage: args.usage,
    });
    
    // Future: Implement proper usage tracking
  },
});

// Factory function to create customized agents with specific settings
export function createCustomAgent(apiKey: string, model: string, instructions?: string) {
  return new Agent(components.agent, {
    chat: openai.chat(model as any, { apiKey }),
    textEmbedding: openai.embedding("text-embedding-3-small", { apiKey }),
    instructions: instructions || "You are a helpful assistant.",
    tools: { searchDocuments },
    // Other options similar to assistantAgent
    // ...
  });
}
```

### 1.2 Update Schema

**File:** `/packages/backend/convex/assistants/schema.ts`

```typescript
import { zid, zodToConvexFields } from "convex-helpers/server/zod";
import { Table } from "convex-helpers/server";
import { z } from "zod";
import { Doc } from "@/_generated/dataModel";

// Updated schema definition
export const assistants = {
  organizationId: zid("organizations"),
  aiProviderId: zid("aiProviders").optional(),
  name: z.string().optional(),
  model: z.enum(["gpt-4o", "gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])),
  fileIds: z.array(z.string()),
  metadata: z.record(z.string(), z.string()).optional(),
  status: z.enum(["creating", "ready", "failed"]),
  
  // Store primary thread ID for this assistant
  primaryThreadId: z.string().optional(),
  
  // No longer needed as we'll use the agent's storage
  // Remove externalId, lastSynced, usesAgent, and agentThreadId
};

export const Assistants = Table("assistants", zodToConvexFields(assistants));
export type AssistantDoc = Doc<"assistants">;
```

### 1.3 Refactor Thread Management

**File:** `/packages/backend/convex/assistants/threads.ts`

```typescript
import { v } from "convex/values";
import { action, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { assistantAgent, createCustomAgent } from "../agents";

/**
 * Create a new thread and generate an initial response
 */
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

    // Determine which agent to use
    let agent = assistantAgent;
    
    // If custom API key is needed, create a custom agent
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      if (provider?.apiKey) {
        agent = createCustomAgent(
          provider.apiKey,
          assistant.model,
          assistant.instructions
        );
      }
    }

    // Create thread with the agent
    const { threadId, thread } = await agent.createThread(ctx, {
      userId: userId.toString(),
      metadata: {
        assistantId: args.assistantId.toString(),
        assistantName: assistant.name || "Assistant",
        organizationId: assistant.organizationId.toString(),
        fileIds: args.fileIds || assistant.fileIds || [],
      },
    });

    // Save primary thread ID for this assistant if it's the first thread
    if (!assistant.primaryThreadId) {
      await ctx.runMutation(internal.assistants.functions.updateAssistant, {
        assistantId: args.assistantId,
        primaryThreadId: threadId,
      });
    }

    // Generate initial response with context
    const result = await thread.generateText({
      prompt: args.prompt,
      contextMessages: assistant.initialPrompt
        ? [{ role: "assistant", content: assistant.initialPrompt }]
        : undefined,
      stream: true, // Enable streaming by default
    });

    return {
      threadId,
      messageId: result.messageId,
      text: result.text,
    };
  },
});

/**
 * List all messages for a thread with streaming support
 */
export const listThreadMessages = query({
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

/**
 * List all threads for the authenticated user
 */
export const listThreads = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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

### 1.4 Implement Direct Streaming

**File:** `/packages/backend/convex/assistants/streaming.ts`

```typescript
import { v } from "convex/values";
import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import { assistantAgent, createCustomAgent } from "../agents";

/**
 * Generate streaming response using the Convex agent
 * Uses the agent's built-in streaming capabilities
 */
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

    // Determine which agent to use
    let agent = assistantAgent;
    
    // If custom API key is needed, create a custom agent
    if (assistant.aiProviderId) {
      const provider = await ctx.runQuery(internal.aiProviders.getAIProvider, {
        providerId: assistant.aiProviderId,
      });
      if (provider?.apiKey) {
        agent = createCustomAgent(
          provider.apiKey,
          assistant.model,
          assistant.instructions
        );
      }
    }

    // Continue thread with the agent
    const { thread } = await agent.continueThread(ctx, {
      threadId: args.threadId,
      userId: userId.toString(),
    });

    // Generate streaming response directly
    return await thread.generateText({
      prompt: args.prompt,
      stream: true,
    });
  },
});
```

## Phase 2: Frontend Updates

### 2.1 Create Optimized Hooks

**File:** `/apps/app/src/hooks/useAssistantThread.ts`

```typescript
import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
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
  const [error, setError] = useState<string | null>(null);

  // Use the agent's built-in hooks with streaming
  const {
    messages,
    isLoading,
    isStreaming,
    optimisticallySendMessage,
  } = useThreadMessages(
    api.assistants.threads.listThreadMessages,
    threadId ? { threadId } : "skip",
    { stream: true }
  );

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
          optimisticallySendMessage(
            {
              threadId,
              content: prompt,
              role: "user",
            },
            {
              // Parameters for generateStreamingResponse
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

### 2.2 Implement Smooth Text Rendering

**File:** `/apps/app/src/hooks/useSmoothText.ts`

```typescript
import { useSmoothText as useConvexSmoothText } from "@convex-dev/agent/react";

/**
 * Hook for smooth text rendering of streaming content
 * 
 * @param text The text to smooth
 * @param isStreaming Whether the text is currently streaming
 * @param options Configuration options
 * @returns The smoothed text
 */
export function useSmoothText(
  text: string,
  isStreaming: boolean,
  options?: {
    initialCharsPerSecond?: number; // Initial rendering speed
    adaptiveSpeed?: boolean; // Whether to adapt to actual streaming speed
  }
) {
  return useConvexSmoothText(text, isStreaming, options);
}
```

### 2.3 Update Chat Interface

**File:** `/apps/app/src/components/assistants/chat-interface.tsx`

```typescript
import { useState, useRef, useEffect } from "react";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useAssistantThread } from "@/hooks/useAssistantThread";
import { useSmoothText } from "@/hooks/useSmoothText";
import { Button } from "@v1/ui/button";
import { Textarea } from "@v1/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@v1/ui/card";
import { Avatar } from "@v1/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";

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

  // Use the updated hook with optimistic updates
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

  // Render message with smooth text effect
  const renderMessage = (message) => {
    const isUser = message.role === "user";
    
    // Apply smooth text rendering to assistant messages
    const content = isUser 
      ? message.content 
      : useSmoothText(message.content, message.isStreaming, {
          initialCharsPerSecond: 25, // Adjust for desired speed
          adaptiveSpeed: true,      // Adapt to actual streaming speed
        });
    
    return (
      <div 
        key={message.id}
        className={cn(
          "flex w-full mb-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {/* Message rendering UI - Same as current implementation */}
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
      {/* Card header, content, and footer - Same as current implementation */}
    </Card>
  );
}
```

### 2.4 Update Assistant Form

**File:** `/apps/app/src/app/[locale]/(dashboard)/_components/assistants/assistant-form.tsx`

```typescript
// Update form schema to match new backend schema
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  model: z.enum(["gpt-4o", "gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  tools: z.array(z.enum(["retrieval", "code_interpreter", "function"])),
  // Remove fields that are no longer needed
}).refine(
  // Refinement logic stays the same
);

// Update the interface to match schema changes
interface AssistantFormProps {
  organizationId: Id<"organizations">;
  assistant?: {
    _id: Id<"assistants">;
    name?: string;
    model: "gpt-4o" | "gpt-4-turbo-preview" | "gpt-4" | "gpt-3.5-turbo";
    instructions?: string;
    description?: string;
    initialPrompt?: string;
    disclaimer?: string;
    mode: "open" | "restricted";
    restrictedResponse?: string;
    tools: string[];
    // Remove fields that are no longer needed
  };
}

// Form initialization and submission logic stays mostly the same
// but removes references to fields that are no longer needed
```

## Phase 3: Testing and Verification

### 3.1 Validation Testing

1. **Schema Updates**
   - Verify schema changes in the generated data model
   - Check that deprecated fields are removed

2. **Agent Functionality**
   - Test the centralized agent configuration
   - Verify tool invocations work properly

3. **Thread Management**
   - Create threads and check storage in the database
   - Verify proper metadata association

4. **Streaming**
   - Test real-time streaming with the native agent capabilities
   - Measure performance compared to previous implementation

### 3.2 UI Testing

1. **Chat Interface**
   - Verify smooth text rendering
   - Test optimistic updates for message sending
   - Check proper error handling

2. **Form Updates**
   - Verify form reflects schema changes
   - Test creating and updating assistants

### 3.3 Regression Testing

1. **Existing Functionality**
   - Ensure all current features still work
   - Verify API compatibility for external integrations

2. **Performance Comparison**
   - Measure response times
   - Check memory usage
   - Evaluate streaming responsiveness

## Phase 4: Documentation and Cleanup

### 4.1 Update Documentation

1. **Development Guides**
   - Document the new agent architecture
   - Provide examples of proper usage

2. **API Documentation**
   - Update endpoint documentation
   - Document schema changes

### 4.2 Code Cleanup

1. **Remove Legacy Code**
   - Remove deprecated functions and components
   - Clean up unused imports and variables

2. **Optimize Dependencies**
   - Ensure proper dependency management
   - Remove unnecessary packages

## Timeline Estimate

- **Phase 1: Backend Restructuring** - 3-4 days
  - Centralized agent configuration - 1 day
  - Schema updates - 1 day
  - Thread management refactoring - 1-2 days
  - Streaming implementation - 1 day

- **Phase 2: Frontend Updates** - 2-3 days
  - Hook updates - 1 day
  - Chat interface updates - 1 day
  - Form updates - 1 day

- **Phase 3: Testing** - 2-3 days
  - Functional testing - 1-2 days
  - UI testing - 1 day
  - Regression testing - 1 day

- **Phase 4: Documentation and Cleanup** - 1-2 days
  - Documentation - 1 day
  - Code cleanup - 1 day

**Total Estimated Time:** 8-12 days

## Migration Strategy

### Initial vs. Complete Migration

Our initial migration (steps 1-3 already implemented) focused on:
1. Installing the Convex agent package
2. Adding basic schema support
3. Making minimal changes to the existing code

This complete migration plan goes further by:
1. Fully embracing the Convex agent's architecture
2. Leveraging native thread management and streaming
3. Optimizing frontend components for the agent's capabilities
4. Removing legacy code and simplifying the codebase

### Data Migration Considerations

Since we have no real users or data yet, we can:
1. Implement a clean break migration
2. Create new database tables for the agent's thread management
3. Skip complex data migration procedures

### Key Benefits

1. **Performance**: Native streaming and optimistic updates
2. **Maintainability**: Simplified codebase and centralized configuration
3. **Features**: Better context handling and tool integration
4. **Future-proofing**: Alignment with Convex's best practices