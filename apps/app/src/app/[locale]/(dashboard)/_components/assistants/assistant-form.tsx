"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Id } from "@v1/backend/convex/_generated/dataModel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@v1/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@v1/ui/form";
import { Input } from "@v1/ui/input";
import { Textarea } from "@v1/ui/textarea";
import { useToast } from "@v1/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@v1/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

// Define form schema with simplified options for non-technical users
const formSchema = z.object({
  // Required name field
  name: z.string().min(1, { message: "Name is required" }),
  // Brief description of what the assistant does
  description: z.string().optional(),
  // Instructions for the assistant's behavior
  instructions: z.string().optional(),
  // Hidden fields with defaults
  model: z.enum(["gpt-4o"]).default("gpt-4o"),
  tools: z.array(z.enum(["retrieval"])).default(["retrieval"]),
  initialPrompt: z.string().optional(),
  // These fields will be added during form submission
  // fileIds: z.array(z.string()).default([]),
  // status: z.enum(["creating", "ready", "failed"]).default("creating"),
  // mode: z.enum(["open", "restricted"]).default("open"),
});

interface AssistantFormProps {
  organizationId: Id<"organizations">;
  assistant?: {
    _id: Id<"assistants">;
    name?: string;
    model: "gpt-4o";
    instructions?: string;
    description?: string;
    initialPrompt?: string;
    disclaimer?: string;
    tools: string[];
    // Legacy fields included for backwards compatibility
    mode?: "open" | "restricted";
    restrictedResponse?: string;
  };
}

export function AssistantForm({ organizationId, assistant }: AssistantFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAssistant = useMutation(api.assistants.functions.createAssistant);
  const updateAssistant = useMutation(api.assistants.functions.updateAssistant);

  const isEdit = !!assistant;
  
  // Default system prompt for new assistants
  const defaultSystemPrompt = "You are a helpful assistant that provides accurate and concise information. You can search through documents to find relevant information. When you don't know something, be honest about it.";

  // Initialize form with assistant data or simplified defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: assistant ? {
      name: assistant.name || "",
      model: "gpt-4o", // Always use the most capable model
      instructions: assistant.instructions || "",
      description: assistant.description || "",
      initialPrompt: assistant.initialPrompt || "",
      tools: ["retrieval"],
    } : {
      name: "",
      model: "gpt-4o",
      instructions: "",
      description: "",
      initialPrompt: "",
      tools: ["retrieval"],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Add defaults for simplified form
      const assistantData = {
        ...values,
        // Set default mode to open (unrestricted)
        mode: "open",
        // Always use retrieval tool
        tools: ["retrieval"] as ["retrieval"],
        // Use instructions as provided or default if empty
        instructions: values.instructions || defaultSystemPrompt,
        // Initialize empty fileIds array (required by server)
        fileIds: [],
        // Set initial status (required by server)
        status: "creating" as const,
      };
      
      if (isEdit && assistant) {
        await updateAssistant({
          assistantId: assistant._id,
          ...assistantData,
        });

        toast({
          title: "Assistant updated",
          description: "Your assistant has been updated successfully.",
        });
      } else {
        // Create the assistant
        const result = await createAssistant({
          organizationId,
          ...assistantData,
        });

        toast({
          title: "Assistant created",
          description: "Your new assistant has been created successfully.",
        });

        // Navigate to the assistant page
        router.push(`/assistants/${result._id}`);
      }
    } catch (error: any) {
      console.error("Error creating/updating assistant:", error);
      
      // Extract error message for display
      const errorMessage = error.message || `Failed to ${isEdit ? "update" : "create"} assistant`;
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <Button 
          variant="ghost" 
          className="mb-2 w-fit p-0 hover:bg-transparent"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <CardTitle>{isEdit ? "Edit Assistant" : "Create New Assistant"}</CardTitle>
        <CardDescription>
          {isEdit 
            ? "Update your assistant's settings"
            : "Configure your AI assistant with a few simple settings"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-6 rounded-md bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Agent Name field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Knowledge Assistant" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs mt-1">
                    What users will see when interacting with your assistant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Answers questions based on your documents"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs mt-1">
                    Briefly describe what this agent does
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* System Prompt (Instructions) field */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1">
                    <FormLabel className="mb-0">System Prompt</FormLabel>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 py-1 text-xs"
                      onClick={() => {
                        field.onChange(defaultSystemPrompt);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                      </svg>
                      Use Default
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Define how the agent should behave and use its tools"
                      rows={6}
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs mt-1">
                    Instructions that define how your agent behaves and uses its tools
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields with defaults - we'll handle these in onSubmit instead */}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6 mt-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Assistant" : "Create Assistant"}
        </Button>
      </CardFooter>
    </Card>
  );
} 