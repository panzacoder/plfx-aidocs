import { Header } from "@/app/[locale]/(dashboard)/_components/header";
import { getScopedI18n } from "@/locales/server";

export const metadata = {
  title: "Home",
};

import { buttonVariants } from "@v1/ui/button";
import { cn } from "@v1/ui/utils";
import { ExternalLink, Plus } from "lucide-react";

import { AssistantForm } from "./_components/forms/assistant";

export default async function Page() {
  const t = await getScopedI18n("dashboard");

  return (
    <>
      <Header title={t("title")} description={t("description")} />
      <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
          <div className="flex w-full flex-col rounded-lg border border-border bg-card dark:bg-black">
            <div className="flex w-full flex-col rounded-lg p-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-primary">
                  {t("bodyTitle")}
                </h2>
                <p className="text-sm font-normal text-primary/60">
                  {t("bodyDescription")}
                </p>
              </div>
            </div>
            <div className="flex w-full px-6">
              <div className="w-full border-b border-border" />
            </div>
            <div className="relative mx-auto flex w-full  flex-col items-center p-6">
              <div className="relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border border-border bg-secondary px-6 py-24 dark:bg-card">
                <div className="z-10 flex max-w-[460px] flex-col items-center gap-4">
                  {/* <AssistantForm /> */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-card hover:border-primary/40">
                    <Plus className="h-8 w-8 stroke-[1.5px] text-primary/60" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-base font-medium text-primary">
                      {t("title")}
                    </p>
                    <p className="text-center text-base font-normal text-primary/60">
                      {t("description")}
                    </p>
                    <span className="hidden select-none items-center rounded-full bg-green-500/5 px-3 py-1 text-xs font-medium tracking-tight text-green-700 ring-1 ring-inset ring-green-600/20 backdrop-blur-md dark:bg-green-900/40 dark:text-green-100 md:flex">
                      {t("bodyTip")}
                    </span>
                  </div>
                </div>
                <div className="z-10 flex items-center justify-center">
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://github.com/get-convex/v1/tree/main/docs"
                    className={cn(
                      `${buttonVariants({ variant: "ghost", size: "sm" })} gap-2`,
                    )}
                  >
                    <span className="text-sm font-medium text-primary/60 group-hover:text-primary">
                      {t("documentationLink")}
                    </span>
                    <ExternalLink className="h-4 w-4 stroke-[1.5px] text-primary/60 group-hover:text-primary" />
                  </a>
                </div>
                <div className="base-grid absolute h-full w-full opacity-40" />
                <div className="absolute bottom-0 h-full w-full bg-gradient-to-t from-[hsl(var(--card))] to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
