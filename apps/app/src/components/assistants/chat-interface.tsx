import { useState, useRef, useEffect } from "react";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { useAssistantThread, type Message } from "@/hooks/useAssistantThread";
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

  // Render chat message with text smoothing
  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    
    // Apply smooth text for streaming assistant messages
    const content = isUser 
      ? message.content 
      : useSmoothText(message.content, message.isStreaming || false);
    
    return (
      <div 
        key={message.id}
        className={cn(
          "flex w-full mb-4",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "flex gap-3 max-w-[80%]",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <Avatar className="h-8 w-8">
            {isUser ? (
              <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-sm">
                U
              </div>
            ) : (
              <div className="bg-secondary text-secondary-foreground h-full w-full flex items-center justify-center text-sm">
                A
              </div>
            )}
          </Avatar>
          
          <div
            className={cn(
              "rounded-lg px-4 py-3 text-sm",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown>{content}</Markdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("flex h-[600px] flex-col", className)}>
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-medium">{assistantName}</CardTitle>
      </CardHeader>
      
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