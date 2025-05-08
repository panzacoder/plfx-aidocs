import type { FC, ReactNode } from "react";

interface HeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const Header: FC<HeaderProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <header className="z-10 flex w-full flex-col border-b border-border bg-card px-6">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between py-12">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-3xl font-medium text-primary/80">{title}</h1>
          <p className="text-base font-normal text-primary/60">{description}</p>
        </div>
        {action && (
          <div className="ml-auto">
            {action}
          </div>
        )}
      </div>
    </header>
  );
};
