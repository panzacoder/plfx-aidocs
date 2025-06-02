import { AnimatedText } from "@/components/animated-text";
import { CopyText } from "@/components/copy-text";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@v1/ui/tooltip";
import Image from "next/image";

export default function Page() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute -top-[118px] inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4.5rem_2rem] -z-10 [transform:perspective(1000px)_rotateX(-63deg)] h-[80%] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none -z-10" />

      <h1 className="font-departure text-[40px] md:text-[84px] relative z-10 text-center h-[120px] md:h-auto leading-tight">
        <AnimatedText text="AI-Powered Care Management" />
      </h1>

      <p className="relative z-10 text-center md:text-xl max-w-[80%] mt-2 md:mt-6">
        Streamline your assisted living facility operations with intelligent documentation, 
        regulatory compliance, and care coordination tools built for healthcare professionals.
      </p>

      {/* In process */}
      {/* <span className="relative z-10 text-center text-[#878787] text-xs mt-2">
        Security verified by Kenshū.
      </span> */}

      <div className="mt-10 mb-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            ✓ HIPAA Compliant
          </span>
          <span className="flex items-center gap-2">
            ✓ Real-time Collaboration
          </span>
          <span className="flex items-center gap-2">
            ✓ AI-Powered Insights
          </span>
        </div>
      </div>

      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={process.env.NEXT_PUBLIC_APP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">Start Your Free Trial →</span>
              </div>
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={15} className="text-xs">
            Access your care management dashboard
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="absolute -bottom-[280px] inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:4.5rem_2rem] -z-10 [transform:perspective(560px)_rotateX(63deg)] pointer-events-none" />
      <div className="absolute w-full bottom-[100px] h-1/2  bg-gradient-to-b from-background to-transparent pointer-events-none -z-10" />
    </div>
  );
}
