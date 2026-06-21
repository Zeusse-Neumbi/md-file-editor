import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../lib/markdown";

describe("renderMarkdown", () => {
  it("renders basic markdown", () => {
    const result = renderMarkdown("# Hello");
    expect(result).toContain("<h1");
    expect(result).toContain("Hello");
  });

  it("renders GFM tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const result = renderMarkdown(md);
    expect(result).toContain("<table");
    expect(result).toContain("<th");
    expect(result).toContain("<td");
  });

  it("renders code blocks with syntax highlighting", () => {
    const md = "```js\nconst x = 1;\n```";
    const result = renderMarkdown(md);
    expect(result).toContain("<pre");
    expect(result).toContain("hljs");
    expect(result).toContain("<code");
  });

  it("returns empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown(undefined as unknown as string)).toBe("");
  });

  it("renders plain text without tags", () => {
    const result = renderMarkdown("just text");
    expect(result).toContain("just text");
  });

  it("renders blockquotes", () => {
    const md = "> quote";
    const result = renderMarkdown(md);
    expect(result).toContain("<blockquote");
    expect(result).toContain("quote");
  });

  it("renders unordered lists", () => {
    const md = "- item 1\n- item 2";
    const result = renderMarkdown(md);
    expect(result).toContain("<ul");
    expect(result).toContain("<li");
    expect(result).toContain("item 1");
    expect(result).toContain("item 2");
  });

  it("renders ordered lists", () => {
    const md = "1. first\n2. second";
    const result = renderMarkdown(md);
    expect(result).toContain("<ol");
    expect(result).toContain("first");
    expect(result).toContain("second");
  });

  it("renders links", () => {
    const md = "[click](https://example.com)";
    const result = renderMarkdown(md);
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain("click");
  });

  it("renders images", () => {
    const md = "![alt](img.png)";
    const result = renderMarkdown(md);
    expect(result).toContain('<img src="img.png"');
  });

  it("strips XSS from raw HTML in markdown", () => {
    const md = '<script>alert("xss")</script>';
    const result = renderMarkdown(md);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
  });

  it("strips onclick attributes", () => {
    const md = '<a onclick="alert(1)">click</a>';
    const result = renderMarkdown(md);
    expect(result).not.toContain("onclick");
  });

  it("renders horizontal rules", () => {
    const result = renderMarkdown("---");
    expect(result).toContain("<hr");
  });

  it("renders inline code", () => {
    const result = renderMarkdown("Use `code` here");
    expect(result).toContain("<code");
    expect(result).toContain("code");
  });

  it("renders task lists", () => {
    const md = "- [x] done\n- [ ] todo";
    const result = renderMarkdown(md);
    expect(result).toContain('checked');
    expect(result).toContain("done");
    expect(result).toContain("todo");
  });
});
