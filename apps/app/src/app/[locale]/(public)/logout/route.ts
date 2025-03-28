import { api } from "@v1/backend/convex/_generated/api";
import { fetchAction } from "convex/nextjs";

import { redirect } from "next/navigation";

export async function GET() {
  await fetchAction(api.auth.signOut, {});

  redirect("/login");
}
