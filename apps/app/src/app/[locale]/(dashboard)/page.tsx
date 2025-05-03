import { Header } from "@/app/[locale]/(dashboard)/_components/header";
import { getScopedI18n } from "@/locales/server";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@v1/ui/card";
import { AssistantsContent } from "./_components/assistants/assistants-content";
import { AssistantsListSkeleton } from "./_components/assistants/assistants-list-skeleton";

export const metadata = {
  title: "AI Assistants Dashboard",
};

export default async function Page() {
  const t = await getScopedI18n("dashboard");

  return (
    <>
      <Header title={t("title")} description={t("description")} />
      <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistants</CardTitle>
              <CardDescription>
                Create and manage your custom AI assistants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<AssistantsListSkeleton />}>
                <AssistantsContent />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
