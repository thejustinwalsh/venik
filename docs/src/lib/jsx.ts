/**
 * Parser for the JSX-like language of the examples page: a single tree of
 * `<Node style={{ ... }}>` elements, where every style value is a number or a
 * string. It records source spans for highlighting and for linking a laid out
 * box back to its lines.
 */

export type TokenType = "tag" | "punct" | "attr" | "key" | "number" | "string" | "comment";

export type Token = { type: TokenType; start: number; end: number };

export type Span = { start: number; end: number };

export type StyleValue = number | string;

export type StyleEntry = {
  key: string;
  value: StyleValue;
  /** From the key to the end of the value. */
  span: Span;
  /** The value alone, for editing it in place. */
  valueSpan: Span;
};

export type Element = {
  /** Text of the tag name, e.g. `Node`. */
  name: string;
  style: StyleEntry[];
  children: Element[];
  /** The opening tag, `<Node ...>` or `<Node ... />`. */
  open: Span;
  /** The closing tag `</Node>`, or null for a self-closing element. */
  close: Span | null;
};

export class ParseError extends Error {
  readonly offset: number;
  /** The tokens recognised before the error, for highlighting what parsed. */
  readonly tokens: readonly Token[];

  constructor(message: string, offset: number, tokens: readonly Token[]) {
    super(message);
    this.offset = offset;
    this.tokens = tokens;
  }
}

export type ParseResult = { root: Element; tokens: Token[] };

const isIdentStart = (c: string) => /[A-Za-z_$]/.test(c);
const isIdent = (c: string) => /[A-Za-z0-9_$]/.test(c);

export function parse(source: string): ParseResult {
  const tokens: Token[] = [];
  let pos = 0;

  const fail = (message: string, at = pos): never => {
    throw new ParseError(message, at, tokens);
  };
  const token = (type: TokenType, start: number, end: number) => {
    tokens.push({ type, start, end });
  };
  const peek = (offset = 0) => source[pos + offset] ?? "";
  const startsWith = (text: string) => source.startsWith(text, pos);

  const skipSpace = () => {
    for (;;) {
      const c = peek();
      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        pos++;
      } else if (startsWith("//")) {
        const start = pos;
        while (pos < source.length && peek() !== "\n") pos++;
        token("comment", start, pos);
      } else if (startsWith("/*")) {
        const start = pos;
        const end = source.indexOf("*/", pos + 2);
        if (end < 0) fail("Unterminated comment", start);
        pos = end + 2;
        token("comment", start, pos);
      } else {
        return;
      }
    }
  };

  const expect = (text: string, type: TokenType = "punct") => {
    if (!startsWith(text)) fail(`Expected \`${text}\``);
    token(type, pos, pos + text.length);
    pos += text.length;
  };

  const ident = (): string => {
    const start = pos;
    if (!isIdentStart(peek())) fail("Expected a name");
    while (isIdent(peek())) pos++;
    return source.slice(start, pos);
  };

  const string = (): string => {
    const quote = peek();
    const start = pos;
    pos++;
    while (pos < source.length && peek() !== quote && peek() !== "\n") pos++;
    if (peek() !== quote) fail("Unterminated string", start);
    pos++;
    token("string", start, pos);
    return source.slice(start + 1, pos - 1);
  };

  const number = (): number => {
    const start = pos;
    if (peek() === "-" || peek() === "+") pos++;
    while (/[0-9.]/.test(peek())) pos++;
    if (peek() === "e" || peek() === "E") {
      pos++;
      if (peek() === "-" || peek() === "+") pos++;
      while (/[0-9]/.test(peek())) pos++;
    }
    const text = source.slice(start, pos);
    const value = Number(text);
    if (text === "" || text === "-" || Number.isNaN(value)) fail("Expected a number", start);
    token("number", start, pos);
    return value;
  };

  const value = (): StyleValue => {
    const c = peek();
    if (c === '"' || c === "'") return string();
    if (c === "-" || c === "+" || c === "." || /[0-9]/.test(c)) {
      // A bare number or a ratio such as `16 / 9`.
      let result = number();
      for (;;) {
        const save = pos;
        skipSpace();
        if (!startsWith("/")) {
          pos = save;
          return result;
        }
        expect("/");
        skipSpace();
        result /= number();
      }
    }
    if (startsWith("Infinity")) {
      token("number", pos, pos + 8);
      pos += 8;
      return Infinity;
    }
    if (isIdentStart(c)) {
      const start = pos;
      const name = ident();
      fail(`Unexpected identifier \`${name}\`; write it as a string`, start);
    }
    return fail("Expected a number or a string");
  };

  const styleObject = (): StyleEntry[] => {
    const entries: StyleEntry[] = [];
    expect("{{");
    for (;;) {
      skipSpace();
      if (startsWith("}}")) break;
      const start = pos;
      let key: string;
      if (peek() === '"' || peek() === "'") {
        key = string();
      } else {
        if (!isIdentStart(peek())) fail("Expected a style name");
        key = ident();
        token("key", start, pos);
      }
      skipSpace();
      expect(":");
      skipSpace();
      const valueStart = pos;
      const v = value();
      entries.push({ key, value: v, span: { start, end: pos }, valueSpan: { start: valueStart, end: pos } });
      skipSpace();
      if (startsWith(",")) {
        expect(",");
        continue;
      }
      if (!startsWith("}}")) fail("Expected `,` or `}}`");
    }
    expect("}}");
    return entries;
  };

  const element = (): Element => {
    const openStart = pos;
    expect("<", "tag");
    const nameStart = pos;
    const name = ident();
    if (name !== "Node") fail(`Unknown element \`${name}\`; only \`Node\` exists`, nameStart);
    token("tag", nameStart, pos);
    let style: StyleEntry[] = [];
    for (;;) {
      skipSpace();
      if (startsWith("/>") || startsWith(">")) break;
      if (pos >= source.length) fail(`Unclosed \`<${name}\` tag`, openStart);
      const attrStart = pos;
      const attr = ident();
      token("attr", attrStart, pos);
      skipSpace();
      expect("=");
      skipSpace();
      if (attr === "style") {
        if (!startsWith("{{")) fail("Expected `{{` after `style=`");
        style = styleObject();
      } else if (peek() === '"' || peek() === "'") {
        string();
      } else {
        fail(`Only \`style={{ ... }}\` and string attributes are supported`, attrStart);
      }
    }
    const children: Element[] = [];
    if (startsWith("/>")) {
      expect("/>", "tag");
      return { name, style, children, open: { start: openStart, end: pos }, close: null };
    }
    expect(">", "tag");
    const open = { start: openStart, end: pos };
    for (;;) {
      skipSpace();
      if (startsWith("{/*")) {
        // A JSX comment: `{/* ... */}`.
        const start = pos;
        const end = source.indexOf("*/}", pos);
        if (end < 0) fail("Unterminated comment", start);
        pos = end + 3;
        token("comment", start, pos);
        continue;
      }
      if (startsWith("</")) break;
      if (peek() !== "<") fail(pos >= source.length ? `Missing \`</${name}>\`` : "Expected a child element");
      children.push(element());
    }
    const closeStart = pos;
    expect("</", "tag");
    const closeNameStart = pos;
    const closeName = ident();
    if (closeName !== name) fail(`Expected \`</${name}>\``, closeNameStart);
    token("tag", closeNameStart, pos);
    skipSpace();
    expect(">", "tag");
    return { name, style, children, open, close: { start: closeStart, end: pos } };
  };

  skipSpace();
  if (peek() !== "<") fail(pos >= source.length ? "Write a `<Node>` element" : "Expected `<`");
  const root = element();
  skipSpace();
  if (pos < source.length) fail("Only one root element is allowed");
  return { root, tokens };
}

/** Maps offsets to zero-based line numbers. */
export class LineIndex {
  private readonly starts: number[] = [0];

  constructor(source: string) {
    for (let i = 0; i < source.length; i++) {
      if (source[i] === "\n") this.starts.push(i + 1);
    }
  }

  get count(): number {
    return this.starts.length;
  }

  lineOf(offset: number): number {
    let low = 0;
    let high = this.starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (this.starts[mid]! <= offset) low = mid;
      else high = mid - 1;
    }
    return low;
  }

  /** Every line a span touches; `end` is exclusive. */
  linesOf(span: Span): number[] {
    const first = this.lineOf(span.start);
    const last = this.lineOf(Math.max(span.start, span.end - 1));
    const lines: number[] = [];
    for (let line = first; line <= last; line++) lines.push(line);
    return lines;
  }
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Turns source into one `<span class="line">` per line, with tokens wrapped in
 * `<span class="tk-<type>">`. Works on any token list, including a partial one
 * from a failed parse, so highlighting survives syntax errors.
 */
export function highlight(source: string, tokens: readonly Token[]): string {
  let html = "";
  let line = "";
  let cursor = 0;
  let tokenIndex = 0;
  const flushLine = () => {
    html += `<span class="line">${line}</span>`;
    line = "";
  };
  const emit = (text: string, cls: string | null) => {
    const parts = text.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) flushLine();
      const part = parts[i]!;
      if (part === "") continue;
      line += cls ? `<span class="${cls}">${escapeHtml(part)}</span>` : escapeHtml(part);
    }
  };
  while (cursor < source.length) {
    const next = tokens[tokenIndex];
    if (next === undefined || next.start >= source.length) {
      emit(source.slice(cursor), null);
      cursor = source.length;
    } else {
      if (next.start > cursor) emit(source.slice(cursor, next.start), null);
      emit(source.slice(next.start, next.end), `tk-${next.type}`);
      cursor = next.end;
      tokenIndex++;
    }
  }
  flushLine();
  return html;
}
