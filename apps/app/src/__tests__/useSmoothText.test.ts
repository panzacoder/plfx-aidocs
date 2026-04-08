import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSmoothText } from "@/hooks/useSmoothText";

describe("useSmoothText", () => {
  it("returns empty string initially", () => {
    const { result } = renderHook(() =>
      useSmoothText("", false),
    );
    expect(result.current).toBe("");
  });

  it("returns full text immediately when not streaming", () => {
    const { result } = renderHook(() =>
      useSmoothText("Hello, world!", false),
    );
    expect(result.current).toBe("Hello, world!");
  });

  it("returns full text when streaming stops", () => {
    const { result, rerender } = renderHook(
      ({ text, isStreaming }) => useSmoothText(text, isStreaming),
      { initialProps: { text: "Hello", isStreaming: true } },
    );

    // Stop streaming
    rerender({ text: "Hello, world!", isStreaming: false });
    expect(result.current).toBe("Hello, world!");
  });

  it("accepts custom speed options", () => {
    const { result } = renderHook(() =>
      useSmoothText("Test", false, {
        initialCharsPerSecond: 50,
        adaptiveSpeed: true,
        minSpeed: 10,
        maxSpeed: 100,
      }),
    );
    expect(result.current).toBe("Test");
  });
});
