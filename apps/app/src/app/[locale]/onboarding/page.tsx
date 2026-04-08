"use client";

import { api } from "@v1/backend/convex/_generated/api";
import * as validators from "@v1/backend/convex/utils/validators";
import { Button } from "@v1/ui/button";
import { Input } from "@v1/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({ username: validators.username });
type FormValues = z.infer<typeof formSchema>;

export default function OnboardingUsername() {
  const user = useQuery(api.users.functions.getUser);
  const router = useRouter();
  const completeOnboarding = useMutation(
    api.users.onboarding.completeOnboarding,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "" },
  });

  useEffect(() => {
    if (!user) return;
    if (user?.username && user?.organization) {
      router.push("/");
    }
  }, [user]);

  if (!user) return null;

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
        onSubmit={handleSubmit(async (values) => {
          await completeOnboarding({ username: values.username });
        })}
      >
        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <Input
            placeholder="Username"
            autoComplete="off"
            required
            {...register("username")}
            className={`bg-transparent ${
              errors.username
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
        </div>

        <div className="flex flex-col">
          {errors.username && (
            <span className="mb-2 text-sm text-destructive dark:text-destructive-foreground">
              {errors.username.message}
            </span>
          )}
        </div>

        <Button type="submit" size="sm" className="w-full">
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Get Started"}
        </Button>
      </form>

      <p className="px-6 text-center text-sm font-normal leading-normal text-primary/60">
        You can update your username at any time from your account settings.
      </p>
    </div>
  );
}
