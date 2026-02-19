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
export declare function parseStreamingJson<T = any>(partialJson: string | undefined): T;
/**
 * Safely stringifies an object to JSON, with error handling for malformed data.
 * Prevents JSON serialization errors from crashing the application.
 *
 * @param value The value to stringify
 * @param fallback Optional fallback string if serialization fails (default: '{}')
 * @returns JSON string or fallback value
 */
export declare function safeStringify(value: unknown, fallback?: string): string;
//# sourceMappingURL=json-parse.d.ts.map