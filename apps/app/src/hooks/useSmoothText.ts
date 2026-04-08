import { useState, useEffect, useRef } from "react";

/**
 * Hook for smooth text rendering optimized for Convex agent streaming
 * Provides a typewriter effect that adapts to real-time streaming patterns
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
    minSpeed?: number; // Minimum chars per second
    maxSpeed?: number; // Maximum chars per second
  }
) {
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextLengthRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const [currentSpeed, setCurrentSpeed] = useState(options?.initialCharsPerSecond || 25);

  // Adaptive speed calculation based on actual streaming rate
  useEffect(() => {
    if (!options?.adaptiveSpeed || !isStreaming) return;

    const now = Date.now();
    const timeDiff = now - lastUpdateTimeRef.current;
    const textDiff = text.length - lastTextLengthRef.current;

    if (timeDiff > 100 && textDiff > 0) { // Update every 100ms minimum
      const actualSpeed = (textDiff / timeDiff) * 1000; // chars per second
      const minSpeed = options?.minSpeed || 10;
      const maxSpeed = options?.maxSpeed || 100;
      
      // Smooth the speed transition
      const newSpeed = Math.max(minSpeed, Math.min(maxSpeed, actualSpeed));
      setCurrentSpeed(prev => prev * 0.7 + newSpeed * 0.3); // Smooth transition
      
      lastTextLengthRef.current = text.length;
      lastUpdateTimeRef.current = now;
    }
  }, [text, isStreaming, options?.adaptiveSpeed, options?.minSpeed, options?.maxSpeed]);

  useEffect(() => {
    // If not streaming, display all text immediately
    if (!isStreaming) {
      setDisplayedText(text);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start smooth display for streaming text
    let currentIndex = displayedText.length;
    
    // If this is a new streaming session, reset
    if (text.length < displayedText.length) {
      currentIndex = 0;
      setDisplayedText("");
    }

    const intervalMs = 1000 / currentSpeed;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        // Show characters progressively
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        // We've caught up to the current text
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
  }, [text, isStreaming, currentSpeed]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return displayedText;
}