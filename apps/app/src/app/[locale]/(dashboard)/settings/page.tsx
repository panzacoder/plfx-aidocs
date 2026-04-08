"use client";

import { UnsubscribeWarningModal } from "@/components/UnsubscribeWarningModal";
import { useScopedI18n } from "@/locales/client";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import * as validators from "@v1/backend/convex/utils/validators";
import { Button } from "@v1/ui/button";
import { Input } from "@v1/ui/input";
import { UploadInput } from "@v1/ui/upload-input";
import { useDoubleCheck } from "@v1/ui/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UploadFileResponse } from "@xixixao/uploadstuff/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const usernameSchema = z.object({ username: validators.username });
type UsernameValues = z.infer<typeof usernameSchema>;

export default function DashboardSettings() {
  const t = useScopedI18n("settings");
  const user = useQuery(api.users.functions.getUser);
  const { signOut } = useAuthActions();
  const updateUserImage = useMutation(api.users.functions.updateUserImage);
  const updateUsername = useMutation(api.users.functions.updateUsername);
  const removeUserImage = useMutation(api.users.functions.removeUserImage);
  const generateUploadUrl = useMutation(api.users.functions.generateUploadUrl);
  const deleteCurrentUserAccount = useAction(
    api.users.functions.deleteCurrentUserAccount,
  );
  const { doubleCheck, getButtonProps } = useDoubleCheck();
  const [isUnsubscribeModalOpen, setIsUnsubscribeModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: user?.username ?? "" },
  });

  useEffect(() => {
    if (user?.username) {
      reset({ username: user.username });
    }
  }, [user?.username, reset]);

  const handleUpdateUserImage = (uploaded: UploadFileResponse[]) => {
    return updateUserImage({
      imageId: (uploaded[0]?.response as { storageId: Id<"_storage"> })
        .storageId,
    });
  };

  const handleDeleteAccount = async () => {
    if (
      user?.organization?.subscriptionStatus === "active"
    ) {
      setIsUnsubscribeModalOpen(true);
    } else {
      await deleteCurrentUserAccount({});
      signOut();
    }
  };

  const unsubscribeHref = `https://sandbox.polar.sh/purchases/subscriptions/${user?.organization?.polarSubscriptionId}`;

  if (!user) return null;

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* Avatar */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="flex w-full items-start justify-between rounded-lg p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-primary">
              {t("avatar.title")}
            </h2>
            <p className="text-sm font-normal text-primary/60">
              {t("avatar.description")}
            </p>
          </div>
          <label
            htmlFor="avatar_field"
            className="group relative flex cursor-pointer overflow-hidden rounded-full transition active:scale-95"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                className="h-20 w-20 rounded-full object-cover"
                alt={user.username ?? user.email}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
            )}
            <div className="absolute z-10 hidden h-full w-full items-center justify-center bg-primary/40 group-hover:flex">
              <Upload className="h-6 w-6 text-secondary" />
            </div>
          </label>
          <UploadInput
            id="avatar_field"
            type="file"
            accept="image/*"
            className="peer sr-only"
            required
            tabIndex={user ? -1 : 0}
            generateUploadUrl={generateUploadUrl}
            onUploadComplete={handleUpdateUserImage}
          />
        </div>
        <div className="flex min-h-14 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-secondary px-6 dark:bg-card">
          <p className="text-sm font-normal text-primary/60">
            {t("avatar.uploadHint")}
          </p>
          {user.avatarUrl && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                removeUserImage({});
              }}
            >
              {t("avatar.resetButton")}
            </Button>
          )}
        </div>
      </div>

      {/* Username */}
      <form
        className="flex w-full flex-col items-start rounded-lg border border-border bg-card"
        onSubmit={handleSubmit(async (values) => {
          await updateUsername({ username: values.username });
        })}
      >
        <div className="flex w-full flex-col gap-4 rounded-lg p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-primary">Your Username</h2>
            <p className="text-sm font-normal text-primary/60">
              This is your username. It will be displayed on your profile.
            </p>
          </div>
          <Input
            placeholder="Username"
            autoComplete="off"
            required
            {...register("username")}
            className={`w-80 bg-transparent ${
              errors.username
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          {errors.username && (
            <p className="text-sm text-destructive dark:text-destructive-foreground">
              {errors.username.message}
            </p>
          )}
        </div>
        <div className="flex min-h-14 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-secondary px-6 dark:bg-card">
          <p className="text-sm font-normal text-primary/60">
            Please use 32 characters at maximum.
          </p>
          <Button type="submit" size="sm">
            Save
          </Button>
        </div>
      </form>

      {/* Delete Account */}
      <div className="flex w-full flex-col items-start rounded-lg border border-destructive bg-card">
        <div className="flex flex-col gap-2 p-6">
          <h2 className="text-xl font-medium text-primary">
            {t("deleteAccount.title")}
          </h2>
          <p className="text-sm font-normal text-primary/60">
            {t("deleteAccount.description")}
          </p>
        </div>
        <div className="flex min-h-14 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-red-500/10 px-6 dark:bg-red-500/10">
          <p className="text-sm font-normal text-primary/60">
            {t("deleteAccount.warning")}
          </p>
          <Button
            size="sm"
            variant="destructive"
            {...getButtonProps({
              onClick: doubleCheck ? handleDeleteAccount : undefined,
            })}
          >
            {doubleCheck
              ? t("deleteAccount.confirmButton")
              : t("deleteAccount.deleteButton")}
          </Button>
        </div>
      </div>

      <UnsubscribeWarningModal
        isOpen={isUnsubscribeModalOpen}
        onClose={() => setIsUnsubscribeModalOpen(false)}
        unsubscribeHref={unsubscribeHref}
      />
    </div>
  );
}
