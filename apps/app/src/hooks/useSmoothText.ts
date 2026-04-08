import { useState, useEffect, useRef } from "react";

/**
 * Adaptive-speed typewriter effect for streaming text.
 * Provides smooth rendering that adapts to the actual streaming rate.
 */
export function useSmoothText(
  text: string,
  isStreaming: boolean,
  options?: {
    initialCharsPerSecond?: number;
    adaptiveSpeed?: boolean;
    minSpeed?: number;
    maxSpeed?: number;
  },
) {
  const [displayedText, setDisplayedText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTextLengthRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const [currentSpeed, setCurrentSpeed] = useState(
    options?.initialCharsPerSecond || 25,
  );

  // Adaptive speed calculation
  useEffect(() => {
    if (!options?.adaptiveSpeed || !isStreaming) return;

    const now = Date.now();
    const timeDiff = now - lastUpdateTimeRef.current;
    const textDiff = text.length - lastTextLengthRef.current;

    if (timeDiff > 100 && textDiff > 0) {
      const actualSpeed = (textDiff / timeDiff) * 1000;
      const minSpeed = options?.minSpeed || 10;
      const maxSpeed = options?.maxSpeed || 100;

      const newSpeed = Math.max(minSpeed, Math.min(maxSpeed, actualSpeed));
      setCurrentSpeed((prev) => prev * 0.7 + newSpeed * 0.3);

      lastTextLengthRef.current = text.length;
      lastUpdateTimeRef.current = now;
    }
  }, [text, isStreaming, options?.adaptiveSpeed, options?.minSpeed, options?.maxSpeed]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let currentIndex = displayedText.length;

    if (text.length < displayedText.length) {
      currentIndex = 0;
      setDisplayedText("");
    }

    const intervalMs = 1000 / currentSpeed;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, isStreaming, currentSpeed]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return displayedText;
}
