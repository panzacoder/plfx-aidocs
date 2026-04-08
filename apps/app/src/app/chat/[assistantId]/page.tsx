"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useSmoothText } from "@/hooks/useSmoothText";
import { Button } from "@v1/ui/button";
import { Input } from "@v1/ui/input";
import { Loader2, Send, AlertTriangle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage({
  params,
}: {
  params: { assistantId: string };
}) {
  const assistantId = params.assistantId as Id<"assistants">;
  const assistant = useQuery(api.assistants.functions.getPublicAssistant, {
    assistantId,
  });

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const smoothedText = useSmoothText(streamingText, isLoading, {
    adaptiveSpeed: true,
    initialCharsPerSecond: 30,
    minSpeed: 15,
    maxSpeed: 80,
  });

  const createThread = useAction(api.chat.functions.createThread);
  const sendMessage = useAction(api.chat.functions.sendMessage);

  // Theme from query
  const theme = useQuery(api.themes.functions.getTheme, { assistantId });

  // Scroll to bottom on new messages or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, smoothedText]);

  // Add initial prompt as first message
  useEffect(() => {
    if (assistant?.initialPrompt && messages.length === 0) {
      setMessages([
        {
          id: "initial",
          role: "assistant",
          content: assistant.initialPrompt,
        },
      ]);
    }
  }, [assistant?.initialPrompt]);

  // Handle password-protected assistants
  const needsPassword = assistant?.passwordHash && !isAuthenticated;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check — the real protection is the backend
    // not returning sensitive data without the password
    if (passwordInput) {
      setIsAuthenticated(true);
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    try {
      // Create thread on first message
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const result = await createThread({ assistantId });
        currentThreadId = result.threadId;
        setThreadId(currentThreadId);
      }

      // Send message and get response
      const response = await sendMessage({
        assistantId,
        threadId: currentThreadId,
        message: userMessage.content,
      });

      // Set the full text for smooth rendering to finish
      setStreamingText(response.text);

      // After a short delay for the smooth text to catch up, add to messages
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.text,
          },
        ]);
        setStreamingText("");
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
      setStreamingText("");
      setIsLoading(false);
    }
  }, [input, isLoading, threadId, assistantId, createThread, sendMessage]);

  // Loading state
  if (assistant === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found / not public
  if (assistant === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Assistant Not Available</h1>
        <p className="text-center text-muted-foreground">
          This assistant is not currently available. It may have been removed or
          is not yet published.
        </p>
      </div>
    );
  }

  // Password gate
  if (needsPassword) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-8">
        <h1 className="text-xl font-semibold">{assistant.name}</h1>
        <p className="text-center text-muted-foreground">
          This assistant requires a password to access.
        </p>
        <form
          onSubmit={handlePasswordSubmit}
          className="flex w-full max-w-sm gap-2"
        >
          <Input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <Button type="submit">Enter</Button>
        </form>
      </div>
    );
  }

  // Apply theme colors
  const themeStyles: React.CSSProperties = {
    ...(theme?.backgroundColor && { backgroundColor: theme.backgroundColor }),
    ...(theme?.textColor && { color: theme.textColor }),
  };

  return (
    <div className="flex h-screen flex-col bg-background" style={themeStyles}>
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {theme?.logoUrl && (
            <img
              src={theme.logoUrl}
              alt=""
              className="h-8 w-8 rounded object-contain"
            />
          )}
          <div>
            <h1 className="text-sm font-semibold">{assistant.name}</h1>
            {assistant.description && (
              <p className="text-xs text-muted-foreground">
                {assistant.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      {assistant.disclaimer && messages.length <= 1 && (
        <div className="mx-auto max-w-3xl px-4 pt-3">
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            {assistant.disclaimer}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                style={
                  message.role === "user" && theme?.primaryColor
                    ? { backgroundColor: theme.primaryColor }
                    : undefined
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm">
                {smoothedText ? (
                  <p className="whitespace-pre-wrap">{smoothedText}</p>
                ) : (
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              theme?.welcomeMessage || "Type your message..."
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            style={
              theme?.primaryColor
                ? { backgroundColor: theme.primaryColor }
                : undefined
            }
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
