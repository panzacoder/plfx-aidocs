import {
  convexAuthNextjsToken,
  isAuthenticatedNextjs,
} from "@convex-dev/auth/nextjs/server";
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
  if (!user?.username || !user?.subscription) {
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
