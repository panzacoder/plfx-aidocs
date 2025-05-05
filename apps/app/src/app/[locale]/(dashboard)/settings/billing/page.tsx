"use client";

import { getLocaleCurrency } from "@/utils/misc";
import { api } from "@v1/backend/convex/_generated/api";
import { CURRENCIES, PLANS } from "@v1/backend/convex/constants";
import { Button } from "@v1/ui/button";
import { Switch } from "@v1/ui/switch";
import { useAction, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function BillingSettings() {
  const user = useQuery(api.users.functions.getUser);
  const organization = useQuery(api.organizations.functions.getUserOrganization);
  const createCheckout = useMutation(api.organizations.subscription.createOrganizationCheckout);
  
  const [selectedPlanInterval, setSelectedPlanInterval] = useState<
    "month" | "year"
  >("month");
  const [loading, setLoading] = useState(false);

  const currency = getLocaleCurrency();

  const handleUpgradeCheckout = async (planId: string) => {
    if (!organization?._id) return;
    
    setLoading(true);
    try {
      const result = await createCheckout({
        organizationId: organization._id,
        planId,
        successUrl: window.location.href,
      });
      
      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !organization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = organization.subscriptionPlan || "free";
  const isOnFreePlan = currentPlan === "free";

  // Plan data - replaced with direct definitions rather than DB lookups
  const plans = [
    {
      key: "free",
      name: "Free",
      description: "Basic features for getting started",
      prices: {
        month: {
          usd: { amount: 0 },
          eur: { amount: 0 }
        }
      }
    },
    {
      key: "pro",
      name: "Pro",
      description: "Advanced features for professionals",
      prices: {
        month: {
          usd: { amount: 2900 },
          eur: { amount: 2900 }
        },
        year: {
          usd: { amount: 29000 },
          eur: { amount: 29000 }
        }
      }
    },
    {
      key: "enterprise",
      name: "Enterprise",
      description: "Premium features for teams",
      prices: {
        month: {
          usd: { amount: 9900 },
          eur: { amount: 9900 }
        },
        year: {
          usd: { amount: 99000 },
          eur: { amount: 99000 }
        }
      }
    }
  ];

  const freePlan = plans.find(p => p.key === "free");
  const proPlan = plans.find(p => p.key === "pro");
  
  // Map plan keys to Polar product IDs
  const planIdMap: Record<string, string> = {
    free: "free_plan_id",
    pro: selectedPlanInterval === "month" ? "pro_monthly_plan_id" : "pro_yearly_plan_id",
    enterprise: selectedPlanInterval === "month" ? "enterprise_monthly_plan_id" : "enterprise_yearly_plan_id"
  };

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-2 p-6 py-2">
        <h2 className="text-xl font-medium text-primary">
          This is a demo app.
        </h2>
        <p className="text-sm font-normal text-primary/60">
          Convex SaaS is a demo app that uses Polar test environment. You can
          find a list of test card numbers on the{" "}
          <a
            href="https://docs.polar.sh/testing"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary/80 underline"
          >
            Polar docs
          </a>
          .
        </p>
      </div>

      {/* Organization Info */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 p-6">
          <h2 className="text-xl font-medium text-primary">Organization</h2>
          <p className="flex items-start gap-1 text-sm font-normal text-primary/60">
            {organization.name} • Subscription:{" "}
            <span className="flex h-[18px] items-center rounded-md bg-primary/10 px-1.5 text-sm font-medium text-primary/80">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </span>
            • Status:{" "}
            <span className={`flex h-[18px] items-center rounded-md px-1.5 text-sm font-medium ${
              organization.subscriptionStatus === "active" 
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            }`}>
              {organization.subscriptionStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 p-6">
          <h2 className="text-xl font-medium text-primary">Plan</h2>
          <p className="flex items-start gap-1 text-sm font-normal text-primary/60">
            Choose the plan that works best for your team.
          </p>
        </div>

        <div className="flex w-full flex-col items-center justify-evenly gap-4 border-border p-6 pt-0">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`flex w-full select-none items-center rounded-md border border-border ${
                currentPlan === plan.key && "border-primary/60"
              }`}
            >
              <div className="flex w-full flex-col items-start p-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-primary">
                    {plan.name}
                  </span>
                  {plan.key !== "free" && (
                    <span className="flex items-center rounded-md bg-primary/10 px-1.5 text-sm font-medium text-primary/80">
                      {currency === CURRENCIES.USD ? "$" : "€"}{" "}
                      {/* Get price safely with defaults */}
                      {selectedPlanInterval === "month"
                        ? ((plan.prices?.month && plan.prices.month[currency]?.amount) ?? 0) / 100
                        : ((plan.prices?.year && plan.prices.year[currency]?.amount) ?? 0) / 100}{" "}
                      / {selectedPlanInterval === "month" ? "month" : "year"}
                    </span>
                  )}
                </div>
                <p className="text-start text-sm font-normal text-primary/60">
                  {plan.description}
                </p>
              </div>

              {/* Billing Switch */}
              {plan.key !== "free" && (
                <div className="flex items-center gap-2 px-4">
                  <label
                    htmlFor={`interval-switch-${plan.key}`}
                    className="text-start text-sm text-primary/60"
                  >
                    {selectedPlanInterval === "month" ? "Monthly" : "Yearly"}
                  </label>
                  <Switch
                    id={`interval-switch-${plan.key}`}
                    checked={selectedPlanInterval === "year"}
                    onCheckedChange={() =>
                      setSelectedPlanInterval((prev) =>
                        prev === "month" ? "year" : "month",
                      )
                    }
                  />
                </div>
              )}

              {/* Action Button */}
              <div className="px-4">
                {currentPlan === plan.key ? (
                  <Button disabled variant="outline" size="sm">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant={plan.key === "free" ? "outline" : "default"}
                    onClick={() => handleUpgradeCheckout(planIdMap[plan.key as keyof typeof planIdMap])}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {plan.key === "free" ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex min-h-14 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-secondary px-6 py-3 dark:bg-card">
          <p className="text-sm font-normal text-primary/60">
            You will not be charged for testing the subscription upgrade.
          </p>
        </div>
      </div>

      {/* Manage Subscription */}
      {organization.polarSubscriptionId && (
        <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-2 p-6">
            <h2 className="text-xl font-medium text-primary">
              Manage Subscription
            </h2>
            <p className="flex items-start gap-1 text-sm font-normal text-primary/60">
              Update your payment method, billing address, and more.
            </p>
          </div>

          <div className="flex min-h-14 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-secondary px-6 py-3 dark:bg-card">
            <p className="text-sm font-normal text-primary/60">
              You will be redirected to the Polar Customer Portal.
            </p>

            <a
              href={`https://sandbox.polar.sh/purchases/subscriptions/${organization.polarSubscriptionId}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm">
                Manage
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
