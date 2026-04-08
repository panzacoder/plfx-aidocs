"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { Button } from "@v1/ui/button";
import { Badge } from "@v1/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@v1/ui/card";
import { useAction, useQuery } from "convex/react";
import { useToast } from "@v1/ui/use-toast";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

// Inline plan definitions — plans are managed in Polar, not in the DB
const PLANS = {
  pro: {
    name: "Pro",
    description: "Full access to all features including advanced AI assistants.",
    monthlyPrice: "$20/month",
    yearlyPrice: "$200/year",
  },
};

export default function BillingSettings() {
  const user = useQuery(api.users.functions.getUser);
  const createCheckout = useAction(
    api.organizations.subscription.createOrganizationCheckout,
  );
  const cancelSubscription = useAction(
    api.organizations.subscription.cancelOrganizationSubscription,
  );
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const org = user.organization;
  const subscriptionStatus = org?.subscriptionStatus ?? "none";
  const currentPlan = org?.subscriptionPlan ?? "free";
  const isActive = subscriptionStatus === "active";
  const isCanceled = subscriptionStatus === "canceled";

  const handleUpgrade = async () => {
    if (!org?._id) return;
    setIsLoading(true);
    try {
      const result = await createCheckout({
        organizationId: org._id,
        planId: "pro", // This should be the Polar price ID in production
        successUrl: window.location.href,
      });
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!org?._id) return;
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setIsLoading(true);
    try {
      const result = await cancelSubscription({ organizationId: org._id });
      if (result.success) {
        toast({ title: "Subscription canceled" });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const polarManageUrl = org?.polarSubscriptionId
    ? `https://sandbox.polar.sh/purchases/subscriptions/${org.polarSubscriptionId}`
    : null;

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* Demo notice */}
      <div className="flex w-full flex-col gap-2 p-6 py-2">
        <h2 className="text-xl font-medium text-primary">Billing</h2>
        <p className="text-sm font-normal text-primary/60">
          This app uses the Polar sandbox environment for billing. No real
          charges will be made.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
          <CardDescription className="flex items-center gap-2">
            You are on the{" "}
            <Badge variant="secondary" className="capitalize">
              {currentPlan}
            </Badge>
            plan
            {isActive && (
              <Badge className="bg-green-500/10 text-green-600">Active</Badge>
            )}
            {isCanceled && (
              <Badge variant="destructive">Canceled</Badge>
            )}
          </CardDescription>
        </CardHeader>

        {currentPlan === "free" && (
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{PLANS.pro.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {PLANS.pro.description}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {PLANS.pro.monthlyPrice}
                  </p>
                </div>
                <Button onClick={handleUpgrade} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upgrade
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {isActive && currentPlan !== "free" && (
          <CardContent>
            <div className="rounded-lg border border-primary/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium capitalize">{currentPlan}</h3>
                  <p className="text-sm text-muted-foreground">
                    Your subscription is active.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel Plan
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Manage Subscription */}
      {polarManageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage Subscription</CardTitle>
            <CardDescription>
              Update your payment method, billing address, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={polarManageUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage on Polar
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
