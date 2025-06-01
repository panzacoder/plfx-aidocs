"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { api } from "@v1/backend/convex/_generated/api";
import * as validators from "@v1/backend/convex/utils/validators";
import { Button } from "@v1/ui/button";
import { Input } from "@v1/ui/input";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@v1/ui/use-toast";

export default function OnboardingUsername() {
  const user = useQuery(api.users.functions.getUser);
  const router = useRouter();
  const completeOnboarding = useMutation(api.users.onboarding.completeOnboarding);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      username: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsSubmitting(true);
        const result = await completeOnboarding({
          username: value.username,
        });
        
        if (result.success) {
          toast({
            title: "Welcome!",
            description: "Your account has been set up successfully.",
          });
          router.push("/");
        }
      } catch (error) {
        console.error("Onboarding error:", error);
        toast({
          title: "Error",
          description: "Failed to complete setup. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Redirect if user is already onboarded
  useEffect(() => {
    if (user?.username && user?.organization) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-96 flex-col items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="mb-2 select-none text-6xl">👋</span>
        <h3 className="text-center text-2xl font-medium text-primary">
          Welcome!
        </h3>
        <p className="text-center text-base font-normal text-primary/60">
          Let's get started by choosing a username.
        </p>
      </div>
      <form
        className="flex w-full flex-col items-start gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <form.Field
            name="username"
            validators={{
              onSubmit: validators.username,
            }}
            // biome-ignore lint/correctness/noChildrenProp: tanstack best practice
            children={(field) => (
              <Input
                placeholder="Username"
                autoComplete="off"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`bg-transparent ${
                  field.state.meta?.errors.length > 0 &&
                  "border-destructive focus-visible:ring-destructive"
                }`}
              />
            )}
          />
        </div>

        <div className="flex flex-col">
          {form.state.fieldMeta.username?.errors.length > 0 && (
            <span className="mb-2 text-sm text-destructive dark:text-destructive-foreground">
              {form.state.fieldMeta.username?.errors.join(" ")}
            </span>
          )}
        </div>

        <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ""}
          {isSubmitting ? "Setting up..." : "Continue"}
        </Button>
      </form>

      <p className="px-6 text-center text-sm font-normal leading-normal text-primary/60">
        You can update your username at any time from your account settings.
      </p>
    </div>
  );
}