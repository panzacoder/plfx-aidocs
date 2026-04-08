"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  model: z.string(),
  instructions: z.string().optional(),
  description: z.string().optional(),
  initialPrompt: z.string().optional(),
  disclaimer: z.string().optional(),
  mode: z.enum(["open", "restricted"]),
  restrictedResponse: z.string().optional(),
  isPublic: z.boolean(),
  allowedDomains: z.string().optional(), // comma-separated, parsed on submit
});

type FormValues = z.infer<typeof formSchema>;

interface AssistantFormProps {
  organizationId: Id<"organizations">;
  assistant?: {
    _id: Id<"assistants">;
    name: string;
    model: string;
    instructions?: string;
    description?: string;
    initialPrompt?: string;
    disclaimer?: string;
    mode: "open" | "restricted";
    restrictedResponse?: string;
    isPublic: boolean;
    allowedDomains: string[];
  };
}

export function AssistantForm({
  organizationId,
  assistant,
}: AssistantFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAssistant = useMutation(
    api.assistants.functions.createAssistant,
  );
  const updateAssistant = useMutation(
    api.assistants.functions.updateAssistant,
  );

  const isEdit = !!assistant;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: assistant
      ? {
          name: assistant.name,
          model: assistant.model,
          instructions: assistant.instructions ?? "",
          description: assistant.description ?? "",
          initialPrompt: assistant.initialPrompt ?? "",
          disclaimer: assistant.disclaimer ?? "",
          mode: assistant.mode,
          restrictedResponse: assistant.restrictedResponse ?? "",
          isPublic: assistant.isPublic,
          allowedDomains: assistant.allowedDomains.join(", "),
        }
      : {
          name: "",
          model: "gpt-4o",
          instructions: "",
          description: "",
          initialPrompt: "",
          disclaimer: "",
          mode: "open",
          restrictedResponse: "",
          isPublic: false,
          allowedDomains: "",
        },
  });

  const mode = form.watch("mode");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const domains = values.allowedDomains
        ? values.allowedDomains
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        : [];

      if (isEdit && assistant) {
        await updateAssistant({
          assistantId: assistant._id,
          name: values.name,
          model: values.model,
          instructions: values.instructions,
          description: values.description,
          initialPrompt: values.initialPrompt,
          disclaimer: values.disclaimer,
          mode: values.mode,
          restrictedResponse: values.restrictedResponse,
          isPublic: values.isPublic,
          allowedDomains: domains,
        });

        toast({
          title: "Assistant updated",
          description: "Your assistant has been updated successfully.",
        });
      } else {
        const result = await createAssistant({
          organizationId,
          name: values.name,
          model: values.model,
          instructions: values.instructions,
          description: values.description,
          initialPrompt: values.initialPrompt,
          disclaimer: values.disclaimer,
          mode: values.mode,
          restrictedResponse: values.restrictedResponse,
          isPublic: values.isPublic,
          allowedDomains: domains,
        });

        toast({
          title: "Assistant created",
          description: "Your new assistant has been created successfully.",
        });

        if (result?._id) {
          router.push(`/assistants/${result._id}`);
        }
      }
    } catch (error) {
      console.error("Error creating/updating assistant:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? "update" : "create"} assistant.`,
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
        <CardTitle>
          {isEdit ? "Edit Assistant" : "Create New Assistant"}
        </CardTitle>
        <CardDescription>
          {isEdit
            ? "Update your assistant's settings and capabilities"
            : "Configure a new AI assistant with custom settings"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Name */}
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

            {/* Model */}
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
                      <SelectItem value="gpt-4o">
                        GPT-4o (Recommended)
                      </SelectItem>
                      <SelectItem value="gpt-4o-mini">
                        GPT-4o Mini (Faster, cheaper)
                      </SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The AI model that powers your assistant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
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

            {/* Instructions */}
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
                    System instructions that define how the assistant should
                    behave
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Restricted Mode */}
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
                      <span>
                        {field.value === "restricted" ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    When enabled, the assistant will only answer questions
                    related to its uploaded documents
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
                      Response shown when a question is outside the allowed scope
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Disclaimer */}
            <FormField
              control={form.control}
              name="disclaimer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disclaimer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="This AI assistant is provided for informational purposes..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional disclaimer shown at the start of conversations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Prompt */}
            <FormField
              control={form.control}
              name="initialPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hello! How can I help you today?"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    First message shown when a user starts a conversation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Publishing Settings */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              <h3 className="text-sm font-medium">Publishing</h3>

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel>Public</FormLabel>
                      <FormDescription>
                        Make this chatbot available to end users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowedDomains"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed Domains</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example.com, app.example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of domains allowed to embed this
                      chatbot. Leave empty to allow all.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Update Assistant" : "Create Assistant"}
        </Button>
      </CardFooter>
    </Card>
  );
}
