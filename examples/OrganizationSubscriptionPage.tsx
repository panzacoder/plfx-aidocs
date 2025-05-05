import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@v1/backend/convex/_generated/api";
import { Button } from "@v1/ui/button";
import { Loader2 } from "lucide-react";

export default function OrganizationSubscriptionPage() {
  const organization = useQuery(api.organizations.functions.getUserOrganization);
  const createCheckout = useMutation(api.organizations.subscription.createOrganizationCheckout);
  const cancelSubscription = useMutation(api.organizations.subscription.cancelOrganizationSubscription);
  const [loading, setLoading] = useState(false);
  
  if (!organization) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  
  const handleUpgrade = async (planId: string) => {
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
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }
    
    setLoading(true);
    try {
      await cancelSubscription({
        organizationId: organization._id,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Organization Subscription</h1>
      
      <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-medium">Current Subscription</h2>
        <div className="mt-2 space-y-2">
          <p>Organization: <span className="font-medium">{organization.name}</span></p>
          <p>Status: <span className="font-medium">{organization.subscriptionStatus || "none"}</span></p>
          <p>Plan: <span className="font-medium">{organization.subscriptionPlan || "free"}</span></p>
          {organization.subscriptionUpdatedAt && (
            <p>Last Updated: <span className="font-medium">{new Date(organization.subscriptionUpdatedAt).toLocaleString()}</span></p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-medium">Available Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Free Plan */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="text-md font-medium">Free</h3>
            <p className="mb-2 text-sm text-muted-foreground">Basic features for getting started</p>
            <p className="mb-4 text-xl font-bold">$0/month</p>
            <div className="mt-auto">
              {organization.subscriptionPlan === "free" ? (
                <Button disabled className="w-full">Current Plan</Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => handleUpgrade("free_plan_id")} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Downgrade
                </Button>
              )}
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="text-md font-medium">Pro</h3>
            <p className="mb-2 text-sm text-muted-foreground">Advanced features for professionals</p>
            <p className="mb-4 text-xl font-bold">$29/month</p>
            <div className="mt-auto">
              {organization.subscriptionPlan === "pro" ? (
                <Button disabled className="w-full">Current Plan</Button>
              ) : (
                <Button className="w-full" onClick={() => handleUpgrade("pro_plan_id")} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upgrade
                </Button>
              )}
            </div>
          </div>
          
          {/* Enterprise Plan */}
          <div className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="text-md font-medium">Enterprise</h3>
            <p className="mb-2 text-sm text-muted-foreground">Premium features for teams</p>
            <p className="mb-4 text-xl font-bold">$99/month</p>
            <div className="mt-auto">
              {organization.subscriptionPlan === "enterprise" ? (
                <Button disabled className="w-full">Current Plan</Button>
              ) : (
                <Button className="w-full" onClick={() => handleUpgrade("enterprise_plan_id")} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Upgrade
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {organization.subscriptionStatus === "active" && organization.subscriptionPlan !== "free" && (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Cancel Subscription
          </Button>
        </div>
      )}
    </div>
  );
} 