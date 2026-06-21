import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import DOMPurify from "dompurify";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code: string, lang: string): string {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      try {
        return hljs.highlight(code, { language }).value;
      } catch {
        return code;
      }
    },
  })
);

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "a", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "code", "pre",
  "blockquote", "hr", "table", "thead", "tbody", "tr",
  "th", "td", "img", "input", "del", "ins", "sup", "sub",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "width", "height",
  "class", "target", "rel", "checked", "type",
];

export function renderMarkdown(source: string): string {
  if (!source) return "";
  const raw = marked.parse(source, { gfm: true, breaks: true }) as string;
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
