import { useState, useEffect, useRef } from "react";

/**
 * Hook for smooth text rendering of streaming content
 * Provides a typewriter effect for text that is being streamed
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
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    // If not streaming, display all text immediately
    if (!isStreaming) {
      setDisplayedText(text);
      return;
    }

    // Reset displayed text when starting to stream
    setDisplayedText("");
    let currentIndex = 0;

    const charsPerSecond = options?.initialCharsPerSecond || 30;
    const intervalMs = 1000 / charsPerSecond;

    intervalRef.current = setInterval(() => {
      if (currentIndex < textRef.current.length) {
        setDisplayedText(textRef.current.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        // Clear interval when done
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isStreaming, options?.initialCharsPerSecond]);

  return displayedText;
}