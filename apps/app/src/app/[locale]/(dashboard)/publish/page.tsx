"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import { Badge } from "@v1/ui/badge";
import { Input } from "@v1/ui/input";
import { useToast } from "@v1/ui/use-toast";
import {
  Globe,
  GlobeLock,
  Copy,
  ExternalLink,
  Monitor,
  Smartphone,
  MessageSquare,
} from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
      }}
    >
      <Copy className="mr-2 h-3 w-3" />
      Copy
    </Button>
  );
}

function EmbedPreview({
  mode,
  assistantId,
}: {
  mode: "full" | "partial" | "widget";
  assistantId: string;
}) {
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const chatUrl = `${baseUrl}/chat/${assistantId}`;

  if (mode === "full") {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="aspect-video w-full rounded border bg-background">
          <iframe
            src={chatUrl}
            className="h-full w-full rounded"
            title="Chat preview"
          />
        </div>
      </div>
    );
  }

  if (mode === "partial") {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="mx-auto h-96 w-full max-w-md rounded border bg-background">
          <iframe
            src={chatUrl}
            className="h-full w-full rounded"
            title="Chat preview"
          />
        </div>
      </div>
    );
  }

  // Widget mode preview
  return (
    <div className="relative rounded-lg border bg-muted/30 p-4">
      <div className="flex h-96 items-end justify-end">
        <div className="h-80 w-80 rounded-lg border bg-background shadow-lg">
          <iframe
            src={chatUrl}
            className="h-full w-full rounded-lg"
            title="Chat preview"
          />
        </div>
      </div>
    </div>
  );
}

export default function PublishPage() {
  const user = useQuery(api.users.functions.getUser);
  const org = useQuery(api.organizations.queries.getFirstOrganization);

  const assistants = useQuery(
    api.assistants.functions.listAssistants,
    org ? { organizationId: org._id } : "skip",
  );

  const [selectedAssistant, setSelectedAssistant] =
    useState<Id<"assistants"> | null>(null);
  const [previewMode, setPreviewMode] = useState<
    "full" | "partial" | "widget"
  >("full");

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  if (!user || !org) return null;

  const selected = assistants?.find((a) => a._id === selectedAssistant);
  const chatUrl = selectedAssistant
    ? `${baseUrl}/chat/${selectedAssistant}`
    : null;

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* Assistant Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Publish</CardTitle>
          <CardDescription>
            Deploy your assistants as embeddable chatbots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!assistants || assistants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assistants created yet. Create one from the Dashboard first.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assistants.map((assistant) => (
                <button
                  key={assistant._id}
                  onClick={() => setSelectedAssistant(assistant._id)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition hover:bg-muted/50 ${
                    selectedAssistant === assistant._id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {assistant.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {assistant.model}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {assistant.isPublic ? (
                      <Globe className="h-4 w-4 text-green-600" />
                    ) : (
                      <GlobeLock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Badge
                      variant={
                        assistant.status === "ready" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {assistant.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Embed Options */}
      {selected && chatUrl && (
        <>
          {/* Status Warning */}
          {!selected.isPublic && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardContent className="flex items-center gap-3 pt-6">
                <GlobeLock className="h-5 w-5 text-yellow-600" />
                <p className="text-sm">
                  This assistant is not public yet. Toggle "Public" in the
                  assistant settings to make it available.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Direct Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Direct Link</CardTitle>
              <CardDescription>
                Share this link directly or open in a new tab
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Input value={chatUrl} readOnly className="flex-1 font-mono text-xs" />
              <CopyButton text={chatUrl} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(chatUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Open
              </Button>
            </CardContent>
          </Card>

          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embed Code</CardTitle>
              <CardDescription>
                Copy this code to embed the chatbot on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode selector */}
              <div className="flex gap-2">
                <Button
                  variant={previewMode === "full" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("full")}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Full Page
                </Button>
                <Button
                  variant={previewMode === "partial" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("partial")}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Partial Embed
                </Button>
                <Button
                  variant={previewMode === "widget" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("widget")}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat Widget
                </Button>
              </div>

              {/* Code snippet */}
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">
                  {previewMode === "full" &&
                    `<iframe\n  src="${chatUrl}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="clipboard-write"\n></iframe>`}
                  {previewMode === "partial" &&
                    `<iframe\n  src="${chatUrl}"\n  width="400"\n  height="600"\n  frameborder="0"\n  style="border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"\n  allow="clipboard-write"\n></iframe>`}
                  {previewMode === "widget" &&
                    `<div id="chat-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">\n  <iframe\n    src="${chatUrl}"\n    width="380"\n    height="520"\n    frameborder="0"\n    style="border-radius: 12px; box-shadow: 0 8px 30px rgb(0 0 0 / 0.12);"\n    allow="clipboard-write"\n  ></iframe>\n</div>`}
                </pre>
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={
                      previewMode === "full"
                        ? `<iframe src="${chatUrl}" width="100%" height="600" frameborder="0" allow="clipboard-write"></iframe>`
                        : previewMode === "partial"
                          ? `<iframe src="${chatUrl}" width="400" height="600" frameborder="0" style="border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" allow="clipboard-write"></iframe>`
                          : `<div id="chat-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;"><iframe src="${chatUrl}" width="380" height="520" frameborder="0" style="border-radius: 12px; box-shadow: 0 8px 30px rgb(0 0 0 / 0.12);" allow="clipboard-write"></iframe></div>`
                    }
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <h4 className="mb-2 text-sm font-medium">Preview</h4>
                <EmbedPreview
                  mode={previewMode}
                  assistantId={selectedAssistant}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
