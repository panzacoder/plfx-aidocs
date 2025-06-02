import { Header } from "@/app/[locale]/(dashboard)/_components/header";
import { getScopedI18n } from "@/locales/server";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@v1/ui/card";
import { Button } from "@v1/ui/button";
import { PlusCircle, FileText, Users, Heart } from "lucide-react";
import Link from "next/link";
import { AssistantsContent } from "./_components/assistants/assistants-content";
import { AssistantsListSkeleton } from "./_components/assistants/assistants-list-skeleton";

export const metadata = {
  title: "Care Management Dashboard",
};

export default async function Page() {
  const t = await getScopedI18n("dashboard");

  return (
    <>
      <Header
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild size="sm">
            <Link href="/assistants/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Care Assistant
            </Link>
          </Button>
        }
      />
      <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl flex-col gap-6">
          {/* Quick Stats Cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"> */}
          {/*   <Card> */}
          {/*     <CardContent className="flex items-center p-6"> */}
          {/*       <Heart className="h-8 w-8 text-blue-600 mr-4" /> */}
          {/*       <div> */}
          {/*         <p className="text-sm font-medium text-muted-foreground">Care Quality</p> */}
          {/*         <p className="text-2xl font-bold">98.5%</p> */}
          {/*       </div> */}
          {/*     </CardContent> */}
          {/*   </Card> */}
          {/*   <Card> */}
          {/*     <CardContent className="flex items-center p-6"> */}
          {/*       <Users className="h-8 w-8 text-green-600 mr-4" /> */}
          {/*       <div> */}
          {/*         <p className="text-sm font-medium text-muted-foreground">Active Residents</p> */}
          {/*         <p className="text-2xl font-bold">124</p> */}
          {/*       </div> */}
          {/*     </CardContent> */}
          {/*   </Card> */}
          {/*   <Card> */}
          {/*     <CardContent className="flex items-center p-6"> */}
          {/*       <FileText className="h-8 w-8 text-purple-600 mr-4" /> */}
          {/*       <div> */}
          {/*         <p className="text-sm font-medium text-muted-foreground">Documents</p> */}
          {/*         <p className="text-2xl font-bold">2,847</p> */}
          {/*       </div> */}
          {/*     </CardContent> */}
          {/*   </Card> */}
          {/* </div> */}

          {/* AI Care Assistants Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI Care Assistants</CardTitle>
              <CardDescription>
                Intelligent assistants to help with care documentation, policy
                guidance, and regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<AssistantsListSkeleton />}>
                <AssistantsContent />
              </Suspense>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button asChild>
                <Link href="/assistants/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Care Assistant
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
