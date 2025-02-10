import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@v1/backend/convex/_generated/api";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();

  if (!token) {
    return redirect("/login");
  }

  const user = await fetchQuery(api.users.getUser, {}, { token });
  const checkoutUrl = await fetchAction(
    api.subscriptions.getOnboardingCheckoutUrl,
    {},
    { token },
  );
  if (!checkoutUrl) {
    return null;
  }
  if (!user?.subscription && !user?.polarSubscriptionPendingId) {
    await fetchMutation(
      api.subscriptions.setSubscriptionPending,
      {},
      { token },
    );
    return redirect(checkoutUrl);
  }

  return (
    <div className="relative flex h-screen w-full bg-card">
      <div className="absolute left-1/2 top-8 mx-auto -translate-x-1/2 transform justify-center">
        <Image src="/logo.png" alt="logo" width={100} height={100} />
      </div>
      <div className="z-10 h-screen w-screen">{children}</div>
      <div className="base-grid fixed h-screen w-screen opacity-40" />
      <div className="fixed bottom-0 h-screen w-screen bg-gradient-to-t from-[hsl(var(--card))] to-transparent" />
    </div>
  );
}
