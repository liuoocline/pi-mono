import { describe, expect, it } from "vitest";
import { parseStreamingJson } from "../src/utils/json-parse.js";

/**
 * Test for Chinese quote handling in JSON parsing.
 *
 * Issue: When LLM generates tool call parameters with Chinese quotes (""''),
 * the JSON string may contain unescaped quotes causing parse errors.
 *
 * Example error: "Unexpected token at position 68"
 * Example problematic JSON: {"content": "写一个"策略文档""}
 * Should be: {"content": "写一个\"策略文档\""}
 */

describe("parseStreamingJson - Chinese Quotes Handling", () => {
	it("should parse JSON with Chinese double quotes", () => {
		// Simulate LLM returning JSON with unescaped Chinese quotes
		// Using Unicode escapes to avoid syntax errors: \u201C = " and \u201D = "
		const jsonWithChineseQuotes = '{"content": "写一个\u201C策略文档\u201D"}';
		const result = parseStreamingJson(jsonWithChineseQuotes);

		// After fixing, the Chinese quotes should be escaped
		expect(result).toHaveProperty("content");
		expect(result.content).toContain("策略文档");
	});

	it("should parse JSON with Chinese single quotes", () => {
		// Using Unicode escapes: \u2018 = ' and \u2019 = '
		const jsonWithChineseQuotes = '{"title": "这是\u2018测试\u2019内容"}';
		const result = parseStreamingJson(jsonWithChineseQuotes);

		expect(result).toHaveProperty("title");
		expect(result.title).toContain("测试");
	});

	it("should parse JSON with mixed Chinese quotes", () => {
		const jsonWithMixedQuotes = '{"text": "包含\u201C双引号\u201D和\u2018单引号\u2019的文本"}';
		const result = parseStreamingJson(jsonWithMixedQuotes);

		expect(result).toHaveProperty("text");
		expect(result.text).toContain("双引号");
		expect(result.text).toContain("单引号");
	});

	it("should parse JSON with fullwidth quotation marks", () => {
		// Using Unicode escape: \uFF02 = "
		const jsonWithFullwidth = '{"content": "全角引号\uFF02测试\uFF02"}';
		const result = parseStreamingJson(jsonWithFullwidth);

		expect(result).toHaveProperty("content");
		expect(result.content).toContain("测试");
	});

	it("should handle nested Chinese quotes", () => {
		const jsonWithNested = '{"outer": "外层\u201C内层\u201D文本"}';
		const result = parseStreamingJson(jsonWithNested);

		expect(result).toHaveProperty("outer");
		expect(result.outer).toContain("内层");
	});

	it("should handle multiple fields with Chinese quotes", () => {
		const jsonMultipleFields = '{"title": "标题\u201C测试\u201D", "content": "内容\u2018示例\u2019"}';
		const result = parseStreamingJson(jsonMultipleFields);

		expect(result).toHaveProperty("title");
		expect(result).toHaveProperty("content");
		expect(result.title).toContain("测试");
		expect(result.content).toContain("示例");
	});

	it("should not break valid JSON without special quotes", () => {
		const validJson = '{"name": "test", "value": 123}';
		const result = parseStreamingJson(validJson);

		expect(result).toEqual({ name: "test", value: 123 });
	});

	it("should handle empty string", () => {
		const result = parseStreamingJson("");
		expect(result).toEqual({});
	});

	it("should handle undefined", () => {
		const result = parseStreamingJson(undefined);
		expect(result).toEqual({});
	});

	it("should handle incomplete JSON with Chinese quotes", () => {
		// Simulate streaming incomplete JSON
		const incompleteJson = '{"content": "写一个\u201C策略';
		const result = parseStreamingJson(incompleteJson);

		// Should return partial result or empty object, not throw
		expect(result).toBeDefined();
	});

	it("should handle real-world OpenClaw error case", () => {
		// Based on the actual error from OpenClaw logs
		// Position 68 suggests the error occurs around the Chinese quotes
		const problematicJson =
			'{"path": "strategy.md", "content": "# 策略文档\\n\\n这是一个\u201C策略文档\u201D的示例"}';
		const result = parseStreamingJson(problematicJson);

		expect(result).toHaveProperty("path");
		expect(result).toHaveProperty("content");
		expect(result.path).toBe("strategy.md");
		expect(result.content).toContain("策略文档");
	});

	it("should preserve already escaped quotes", () => {
		const jsonWithEscaped = '{"text": "已转义\\"引号\\""}';
		const result = parseStreamingJson(jsonWithEscaped);

		expect(result).toHaveProperty("text");
		expect(result.text).toContain("引号");
	});

	it("should handle complex nested objects with Chinese quotes", () => {
		const complexJson =
			'{"data": {"title": "标题\u201C测试\u201D", "items": ["项目\u2018一\u2019", "项目\u2018二\u2019"]}}';
		const result = parseStreamingJson(complexJson);

		expect(result).toHaveProperty("data");
		expect(result.data).toHaveProperty("title");
		expect(result.data).toHaveProperty("items");
		expect(result.data.title).toContain("测试");
		expect(result.data.items).toHaveLength(2);
	});

	it("should handle JSON with only Chinese quotes (no regular quotes)", () => {
		// Edge case: entire value is Chinese quotes
		const edgeCase = '{"msg": "\u201C\u201D"}';
		const result = parseStreamingJson(edgeCase);

		expect(result).toHaveProperty("msg");
	});

	it("should handle multiple consecutive Chinese quotes", () => {
		const multipleQuotes = '{"text": "\u201C\u201C\u201C测试\u201D\u201D\u201D"}';
		const result = parseStreamingJson(multipleQuotes);

		expect(result).toHaveProperty("text");
		expect(result.text).toContain("测试");
	});
});
