import { parse as partialParse } from "partial-json";

/**
 * Fixes unescaped special quotes in JSON strings that can cause parse errors.
 * Handles Chinese quotes (""'') and other Unicode quote characters.
 *
 * @param json The JSON string to fix
 * @returns Fixed JSON string with escaped quotes
 */
function fixUnescapedQuotes(json: string): string {
  // Map of special quote characters to their escaped equivalents
  const quoteReplacements: Record<string, string> = {
    "\u201C": '\\"', // " (left double quotation mark)
    "\u201D": '\\"', // " (right double quotation mark)
    "\u2018": "\\'", // ' (left single quotation mark)
    "\u2019": "\\'", // ' (right single quotation mark)
    "\uFF02": '\\"', // " (fullwidth quotation mark)
  };

  // Replace special quotes within JSON string values
  // This regex matches JSON string values: "..." including escaped characters
  return json.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    let fixed = match;
    for (const [specialQuote, escaped] of Object.entries(quoteReplacements)) {
      // Only replace special quotes that appear inside the string value (not the outer quotes)
      if (match.includes(specialQuote)) {
        // Replace special quotes in the middle of the string
        fixed = fixed.replace(new RegExp(specialQuote, "g"), escaped);
      }
    }
    return fixed;
  });
}

/**
 * Attempts to parse potentially incomplete JSON during streaming.
 * Always returns a valid object, even if the JSON is incomplete.
 *
 * Includes automatic fixing of common JSON format issues:
 * - Unescaped Chinese quotes (""'')
 * - Other Unicode quote characters
 *
 * @param partialJson The partial JSON string from streaming
 * @returns Parsed object or empty object if parsing fails
 */
export function parseStreamingJson<T = any>(partialJson: string | undefined): T {
  if (!partialJson || partialJson.trim() === "") {
    return {} as T;
  }

  // Try standard parsing first (fastest for complete JSON)
  try {
    return JSON.parse(partialJson) as T;
  } catch (firstError) {
    // Try fixing unescaped quotes and parse again
    try {
      const fixed = fixUnescapedQuotes(partialJson);
      const result = JSON.parse(fixed) as T;

      // Log successful fix for debugging
      if (fixed !== partialJson) {
        console.warn(
          "[parseStreamingJson] Fixed unescaped quotes in JSON",
          `\nOriginal (first 200 chars): ${partialJson.slice(0, 200)}`,
          `\nFixed (first 200 chars): ${fixed.slice(0, 200)}`,
        );
      }

      return result;
    } catch {
      // Log parse errors for debugging
      const errorMsg = firstError instanceof Error ? firstError.message : String(firstError);
      if (errorMsg.includes("JSON") || errorMsg.includes("position")) {
        console.warn(
          "[parseStreamingJson] JSON parse failed after fix attempt",
          `\nError: ${errorMsg}`,
          `\nJSON (first 200 chars): ${partialJson.slice(0, 200)}`,
        );
      }

      // Try partial-json for incomplete JSON
      try {
        const result = partialParse(partialJson);
        return (result ?? {}) as T;
      } catch {
        // If all parsing fails, return empty object
        return {} as T;
      }
    }
  }
}

/**
 * Safely stringifies an object to JSON, with error handling for malformed data.
 * Prevents JSON serialization errors from crashing the application.
 *
 * @param value The value to stringify
 * @param fallback Optional fallback string if serialization fails (default: '{}')
 * @returns JSON string or fallback value
 */
export function safeStringify(value: unknown, fallback: string = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      "[safeStringify] JSON serialization failed",
      `\nError: ${errorMsg}`,
      `\nValue type: ${typeof value}`,
      `\nValue (first 200 chars): ${String(value).slice(0, 200)}`,
    );

    try {
      const seen = new WeakSet();
      return JSON.stringify(value, (_key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) {
            return "[Circular]";
          }
          seen.add(val);
        }
        if (typeof val === "function") {
          return "[Function]";
        }
        if (typeof val === "symbol") {
          return "[Symbol]";
        }
        if (typeof val === "bigint") {
          return val.toString();
        }
        return val;
      });
    } catch {
      console.error("[safeStringify] Safe stringify also failed, using fallback");
      return fallback;
    }
  }
}
