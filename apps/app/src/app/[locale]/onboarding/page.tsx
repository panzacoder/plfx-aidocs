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
import { useFormStatus } from "react-dom";

export default function OnboardingUsername() {
  const user = useQuery(api.users.functions.getUser);
  const organization = useQuery(
    api.organizations.functions.getUserOrganization,
  );
  const router = useRouter();
  const updateUsername = useMutation(api.users.functions.updateUsername);
  const createOrganization = useMutation(api.organizations.functions.create);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  const { pending } = useFormStatus();

  const form = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      username: "",
    },
    onSubmit: async ({ value }) => {
      await updateUsername({
        username: value.username,
      });

      // Create a default organization for the user if none exists
      if (!organization) {
        await createOrganization({
          name: `${value.username}'s Organization`,
        });
      }
    },
  });

  // Safety timeout to prevent users getting stuck in auth loop
  useEffect(() => {
    console.log({ user, organization });
    if (user?.username && !organization) {
      console.log("User has a username but no organization, starting timer");
      const timer = setTimeout(() => {
        setLoadingTime((prev) => prev + 1);
        // After 10 seconds, force redirect to home to prevent being stuck
        if (loadingTime >= 10) {
          console.log("Loading time exceeded, redirecting to home");
          router.push("/");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, organization, router, loadingTime]);

  // Main redirect effect
  useEffect(() => {
    if (!user) {
      console.log("User not found, returning");
      return;
    }

    // Redirect to home if user has username and belongs to an organization
    if (user?.username && organization) {
      console.log("User and organization found, redirecting to home");
      router.push("/");
    }
  }, [user, organization, router]);

  if (!user) {
    console.log("User not found, returning null");
    return null;
  }

  // Only show the pending screen if there's a username but no organization AND we haven't timed out
  const showSubscriptionPending =
    !!user.username && !organization && loadingTime < 10;

  async function forceHomePage() {
    router.push("/");
  }

  async function createDefaultOrg() {
    if (isCreatingOrg) return; // Prevent multiple clicks

    try {
      setIsCreatingOrg(true);
      console.log("Creating default organization...");
      await createOrganization({
        name: `${user.username || user.name || "User"}'s Organization`,
      });
      console.log("Default organization created");
      console.log("Refreshing router...");
      router.refresh(); // Use router.refresh() instead of hard reload
    } catch (error) {
      console.error("Error creating organization:", error);
      setIsCreatingOrg(false);
    }
  }

  if (showSubscriptionPending) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-base font-normal text-primary/60">
          Setting up your account. This may take a moment... ({10 - loadingTime}
          s)
        </p>

        <div className="mt-4 p-4 bg-background/80 rounded-md shadow-md max-w-md">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
            <p>Username: {user?.username || "not set"}</p>
            <p>Organization: {organization ? organization.name : "None"}</p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button
              onClick={createDefaultOrg}
              className="text-xs"
              variant="default"
              disabled={isCreatingOrg}
            >
              {isCreatingOrg ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Default Organization"
              )}
            </Button>
            <Button
              onClick={forceHomePage}
              className="text-xs"
              variant="outline"
            >
              Go to Home Page
            </Button>
          </div>
        </div>
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

        <Button type="submit" size="sm" className="w-full">
          {pending ? <Loader2 className="animate-spin" /> : "Continue"}
        </Button>
      </form>

      <p className="px-6 text-center text-sm font-normal leading-normal text-primary/60">
        You can update your username at any time from your account settings.
      </p>
    </div>
  );
}
