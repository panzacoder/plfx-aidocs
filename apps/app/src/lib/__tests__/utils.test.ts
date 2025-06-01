import { describe, expect, it, vi } from "vitest";
import {
  cn,
  formatBytes,
  formatDate,
  debounce,
  truncate,
  capitalizeWords,
  generateId,
  getFileExtension,
  getFileIcon,
} from "../utils";

describe("cn", () => {
  it("should combine class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
  });

  it("should merge Tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatBytes", () => {
  it("should format 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("should format bytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("should respect decimal places", () => {
    expect(formatBytes(1536, 1)).toBe("1.5 KB");
    expect(formatBytes(1536, 0)).toBe("2 KB");
  });

  it("should handle very large numbers", () => {
    expect(formatBytes(1125899906842624)).toBe("1 PB");
  });
});

describe("formatDate", () => {
  beforeEach(() => {
    // Mock the current date to January 15, 2024, 10:00 AM
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should format today's date", () => {
    const today = new Date("2024-01-15T14:30:00Z");
    const result = formatDate(today);
    expect(result).toMatch(/^Today at \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("should format yesterday's date", () => {
    const yesterday = new Date("2024-01-14T14:30:00Z");
    const result = formatDate(yesterday);
    expect(result).toMatch(/^Yesterday at \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("should format this year's date", () => {
    const thisYear = new Date("2024-03-20T14:30:00Z");
    const result = formatDate(thisYear);
    expect(result).toMatch(/^Mar 20 at \d{1,2}:\d{2} (AM|PM)$/);
  });

  it("should format previous year's date", () => {
    const lastYear = new Date("2023-06-15T14:30:00Z");
    const result = formatDate(lastYear);
    expect(result).toBe("Jun 15, 2023");
  });
});

describe("debounce", () => {
  it("should debounce function calls", async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn("arg1");
    debouncedFn("arg2");
    debouncedFn("arg3");

    expect(mockFn).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("arg3");
  });

  it("should handle multiple arguments", async () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 50);

    debouncedFn("arg1", "arg2", 123);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFn).toHaveBeenCalledWith("arg1", "arg2", 123);
  });
});

describe("truncate", () => {
  it("should truncate long strings", () => {
    expect(truncate("This is a long string", 10)).toBe("This is a ...");
  });

  it("should not truncate short strings", () => {
    expect(truncate("Short", 10)).toBe("Short");
  });

  it("should handle exact length", () => {
    expect(truncate("Exactly10!", 10)).toBe("Exactly10!");
  });

  it("should handle empty strings", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("capitalizeWords", () => {
  it("should capitalize each word", () => {
    expect(capitalizeWords("hello world")).toBe("Hello World");
  });

  it("should handle single word", () => {
    expect(capitalizeWords("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(capitalizeWords("")).toBe("");
  });

  it("should handle mixed case", () => {
    expect(capitalizeWords("hELLo wORLD")).toBe("HELLo WORLD");
  });

  it("should handle numbers and special characters", () => {
    expect(capitalizeWords("hello 123 world-test")).toBe("Hello 123 World-Test");
  });
});

describe("generateId", () => {
  it("should generate an ID of default length", () => {
    const id = generateId();
    expect(id).toHaveLength(8);
    expect(typeof id).toBe("string");
  });

  it("should generate an ID of specified length", () => {
    const id = generateId(12);
    expect(id.length).toBeLessThanOrEqual(12);
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate different IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("should generate alphanumeric characters", () => {
    const id = generateId(20);
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});

describe("getFileExtension", () => {
  it("should extract file extension", () => {
    expect(getFileExtension("document.pdf")).toBe("pdf");
    expect(getFileExtension("image.PNG")).toBe("png");
    expect(getFileExtension("script.js")).toBe("js");
  });

  it("should handle files without extension", () => {
    expect(getFileExtension("README")).toBe("readme"); // splits by . and takes last part
    expect(getFileExtension("file-without-extension")).toBe("file-without-extension");
  });

  it("should handle multiple dots", () => {
    expect(getFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("should handle empty string", () => {
    expect(getFileExtension("")).toBe("");
  });
});

describe("getFileIcon", () => {
  it("should return correct icons for MIME types", () => {
    expect(getFileIcon("image/png", "image.png")).toBe("image");
    expect(getFileIcon("application/pdf", "document.pdf")).toBe("file-pdf");
  });

  it("should return correct icons for file extensions", () => {
    expect(getFileIcon("", "document.doc")).toBe("file-text");
    expect(getFileIcon("", "document.docx")).toBe("file-text");
    expect(getFileIcon("", "spreadsheet.xlsx")).toBe("file-spreadsheet");
    expect(getFileIcon("", "presentation.pptx")).toBe("file-presentation");
  });

  it("should return correct icons for archive files", () => {
    expect(getFileIcon("", "archive.zip")).toBe("file-archive");
    expect(getFileIcon("", "archive.rar")).toBe("file-archive");
  });

  it("should return correct icons for media files", () => {
    expect(getFileIcon("", "audio.mp3")).toBe("file-audio");
    expect(getFileIcon("", "video.mp4")).toBe("file-video");
  });

  it("should return correct icons for code files", () => {
    expect(getFileIcon("", "index.html")).toBe("file-code");
    expect(getFileIcon("", "data.json")).toBe("file-code");
  });

  it("should return default icon for unknown types", () => {
    expect(getFileIcon("", "unknown.xyz")).toBe("file");
    expect(getFileIcon("application/unknown", "file.unknown")).toBe("file");
  });

  it("should prioritize MIME type over extension", () => {
    expect(getFileIcon("image/jpeg", "not-an-image.pdf")).toBe("image");
  });
});