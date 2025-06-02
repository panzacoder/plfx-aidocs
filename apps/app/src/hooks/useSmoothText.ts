import { useSmoothText as useConvexSmoothText } from "@convex-dev/agent/react";

/**
 * Hook that applies text smoothing to streamed content
 * This is a wrapper around the Convex agent's useSmoothText hook
 * 
 * @param text The text to smooth
 * @param isStreaming Whether the text is currently streaming
 * @param options Smoothing options
 * @returns The smoothed text
 */
export function useSmoothText(
  text: string,
  isStreaming: boolean,
  options?: {
    initialCharsPerSecond?: number;
  }
) {
  return useConvexSmoothText(text, isStreaming, options);
}