import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@v1/backend/convex/_generated/api";
import { fetchQuery, preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import { Navigation } from "./_components/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await convexAuthNextjsToken();

  if (!token) {
    return redirect("/login");
  }

  const user = await fetchQuery(api.users.functions.getUser, {}, { token });

  // Check for username and organizationId (not subscription which was removed)
  // Note: Type inference is lost for nested paths like users.functions.*
  // This is a TypeScript limitation with deeply nested module paths
  if (!user?.username || !user?.organizationId) {
    return redirect("/onboarding");
  }

  const preloadedUser = await preloadQuery(
    api.users.functions.getUser,
    {},
    { token },
  );
  return (
    <div className="flex min-h-[100vh] w-full flex-col bg-secondary dark:bg-black">
      <Navigation preloadedUser={preloadedUser} />
      {children}
    </div>
  );
}
