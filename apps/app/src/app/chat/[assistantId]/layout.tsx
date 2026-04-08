import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description: "AI Assistant Chat",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
