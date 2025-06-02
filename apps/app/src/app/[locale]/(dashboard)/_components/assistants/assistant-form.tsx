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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@v1/ui/select";
import { Switch } from "@v1/ui/switch";
import { useToast } from "@v1/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@v1/ui/card";
import { Checkbox } from "@v1/ui/checkbox";
import { ArrowLeft, Loader2 } from "lucide-react";

// Define form schema
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
}).refine(
  (data) => {
    // If mode is restricted, restrictedResponse is required
    if (data.mode === "restricted") {
      return !!data.restrictedResponse;
    }
    return true;
  },
  {
    message: "Restricted response is required when restricted mode is enabled",
    path: ["restrictedResponse"],
  }
);

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

  // Initialize form with assistant data or defaults
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: assistant ? {
      name: assistant.name || "",
      model: assistant.model,
      instructions: assistant.instructions || "",
      description: assistant.description || "",
      initialPrompt: assistant.initialPrompt || "",
      disclaimer: assistant.disclaimer || "",
      mode: assistant.mode,
      restrictedResponse: assistant.restrictedResponse || "",
      tools: assistant.tools as any[],
    } : {
      name: "",
      model: "gpt-4o",
      instructions: "",
      description: "",
      initialPrompt: "",
      disclaimer: "",
      mode: "open",
      restrictedResponse: "",
      tools: ["retrieval"],
    },
  });

  const mode = form.watch("mode");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Ensure there's at least one tool selected
      if (values.tools.length === 0) {
        form.setError("tools", {
          type: "manual",
          message: "Select at least one tool for your assistant",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (isEdit && assistant) {
        await updateAssistant({
          assistantId: assistant._id,
          ...values,
        });

        toast({
          title: "Assistant updated",
          description: "Your assistant has been updated successfully.",
        });
      } else {
        // Create the assistant without externalId (AI Agent handles this)
        const result = await createAssistant({
          organizationId,
          ...values,
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
            ? "Update your assistant's settings and capabilities"
            : "Configure a new AI assistant with custom settings"
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Assistant" {...field} />
                  </FormControl>
                  <FormDescription>
                    A name for your assistant to help identify it
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The AI model that powers your assistant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A helpful assistant that..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of what this assistant does
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="You are an AI assistant that helps with..." 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    System instructions that define how the assistant should behave
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tools"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Tools</FormLabel>
                    <FormDescription>
                      Enable capabilities for your assistant
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="tools"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("retrieval")}
                                onCheckedChange={(checked) => {
                                  const updatedTools = checked
                                    ? [...field.value, "retrieval"]
                                    : field.value.filter((tool) => tool !== "retrieval");
                                  
                                  // Ensure we always have at least one tool
                                  if (updatedTools.length === 0) {
                                    form.setError("tools", {
                                      type: "manual",
                                      message: "Select at least one tool for your assistant",
                                    });
                                  } else {
                                    form.clearErrors("tools");
                                  }
                                  
                                  field.onChange(updatedTools);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Retrieval</FormLabel>
                              <FormDescription>
                                Allow the assistant to search and retrieve information from files
                              </FormDescription>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="tools"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("code_interpreter")}
                                onCheckedChange={(checked) => {
                                  const updatedTools = checked
                                    ? [...field.value, "code_interpreter"]
                                    : field.value.filter((tool) => tool !== "code_interpreter");
                                  
                                  // Ensure we always have at least one tool
                                  if (updatedTools.length === 0) {
                                    form.setError("tools", {
                                      type: "manual",
                                      message: "Select at least one tool for your assistant",
                                    });
                                  } else {
                                    form.clearErrors("tools");
                                  }
                                  
                                  field.onChange(updatedTools);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Code Interpreter</FormLabel>
                              <FormDescription>
                                Allow the assistant to run code and perform data analysis
                              </FormDescription>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Restricted Mode</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.value === "restricted"}
                        onCheckedChange={(checked) => {
                          field.onChange(checked ? "restricted" : "open");
                        }}
                      />
                      <span>{field.value === "restricted" ? "Enabled" : "Disabled"}</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    When enabled, the assistant will respond with a predefined message to questions outside its knowledge base
                  </FormDescription>
                </FormItem>
              )}
            />

            {mode === "restricted" && (
              <FormField
                control={form.control}
                name="restrictedResponse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restricted Response</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="I can only answer questions about topics in my knowledge base." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Response to show when a question is outside the allowed scope
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* All assistants now use the Convex Agent */}

            <FormField
              control={form.control}
              name="disclaimer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disclaimer</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="This AI assistant is provided for..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional disclaimer to show at the beginning of conversations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Prompt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Hello! How can I help you today?" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional message to start conversations with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
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