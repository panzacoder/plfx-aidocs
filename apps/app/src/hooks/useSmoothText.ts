import { useSmoothText as useConvexSmoothText } from "@convex-dev/agent/react";

/**
 * Hook for smooth text rendering of streaming content
 * This is a wrapper around the Convex agent's useSmoothText hook
 * 
 * @param text The text to smooth
 * @param isStreaming Whether the text is currently streaming
 * @param options Configuration options
 * @returns The smoothed text
 */
export function useSmoothText(
  text: string,
  isStreaming: boolean,
  options?: {
    initialCharsPerSecond?: number; // Initial rendering speed
    adaptiveSpeed?: boolean; // Whether to adapt to actual streaming speed
  }
) {
  return useConvexSmoothText(text, isStreaming, options);
}