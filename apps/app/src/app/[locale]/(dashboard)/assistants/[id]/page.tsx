"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { ChatInterface } from "@/components/assistants/chat-interface";
import { FileManager } from "../../_components/assistants/file-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@v1/ui/card";
import { Button } from "@v1/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@v1/ui/tabs";
import { Badge } from "@v1/ui/badge";
import { Loader2, ArrowLeft, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@v1/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@v1/ui/alert";

export default function AssistantPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const assistantId = params.id as Id<"assistants">;
  const [activeTab, setActiveTab] = useState("chat");
  
  // Get assistant data
  const assistant = useQuery(api.assistants.functions.getAssistant, {
    assistantId,
  });
  
  // Handle loading state
  if (assistant === undefined) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2 p-0 hover:bg-transparent"
            onClick={() => router.push("/assistants")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assistants
          </Button>
          <Skeleton className="h-8 w-48 mt-2" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="h-[600px]">
              <CardHeader className="px-4 py-3 border-b">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="flex-1 p-4">
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Handle not found or error
  if (!assistant) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Assistant not found or you don't have access to it.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button 
            variant="default" 
            onClick={() => router.push("/assistants")}
          >
            Back to Assistants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-2 p-0 hover:bg-transparent"
          onClick={() => router.push("/assistants")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assistants
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{assistant.name || "Assistant"}</h1>
            {assistant.description && (
              <p className="text-muted-foreground mt-1">{assistant.description}</p>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/assistants/${assistantId}/edit`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Assistant Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Model</h3>
                  <p className="text-sm text-muted-foreground">
                    {assistant.model}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Mode</h3>
                  <div className="flex items-center mt-1">
                    <Badge variant={assistant.mode === "restricted" ? "outline" : "secondary"}>
                      {assistant.mode === "restricted" ? "Restricted" : "Open"}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">AI Agent</h3>
                  <div className="flex items-center mt-1">
                    <Badge variant={assistant.agentEnabled !== false ? "success" : "secondary"}>
                      {assistant.agentEnabled !== false ? "Enabled" : "Legacy"}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium">Tools</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {assistant.tools && assistant.tools.map((tool) => (
                      <Badge key={tool} variant="secondary">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {assistant.instructions && (
                  <div>
                    <h3 className="text-sm font-medium">Instructions</h3>
                    <p className="text-sm text-muted-foreground">
                      {assistant.instructions.length > 200
                        ? `${assistant.instructions.slice(0, 200)}...`
                        : assistant.instructions}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-4">
              <ChatInterface 
                assistantId={assistantId}
                assistantName={assistant.name}
                disclaimer={assistant.disclaimer}
                useAgent={assistant.agentEnabled !== false}
              />
            </TabsContent>
            
            <TabsContent value="files" className="mt-4">
              <FileManager assistantId={assistantId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 