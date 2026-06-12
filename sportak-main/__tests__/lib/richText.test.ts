import { parseRichText, parseInline, sanitizeUrl } from "@/lib/richText"

describe("sanitizeUrl", () => {
  it("accepts http and https", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/")
    expect(sanitizeUrl("https://example.com/path?q=1")).toBe(
      "https://example.com/path?q=1",
    )
  })

  it("accepts mailto", () => {
    expect(sanitizeUrl("mailto:hello@example.com")).toBe("mailto:hello@example.com")
  })

  it("rejects javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull()
  })

  it("rejects data: URLs", () => {
    expect(sanitizeUrl("data:text/html,<script>")).toBeNull()
  })

  it("rejects malformed URLs", () => {
    expect(sanitizeUrl("not a url")).toBeNull()
    expect(sanitizeUrl("")).toBeNull()
  })
})

describe("parseInline", () => {
  it("returns plain text as a single text node", () => {
    expect(parseInline("hello world")).toEqual([{ type: "text", text: "hello world" }])
  })

  it("renders bold", () => {
    expect(parseInline("**bold** text")).toEqual([
      { type: "bold", children: [{ type: "text", text: "bold" }] },
      { type: "text", text: " text" },
    ])
  })

  it("renders italic", () => {
    expect(parseInline("*italic* text")).toEqual([
      { type: "italic", children: [{ type: "text", text: "italic" }] },
      { type: "text", text: " text" },
    ])
  })

  it("renders italic inside bold", () => {
    expect(parseInline("**bold *italic* still**")).toEqual([
      {
        type: "bold",
        children: [
          { type: "text", text: "bold " },
          { type: "italic", children: [{ type: "text", text: "italic" }] },
          { type: "text", text: " still" },
        ],
      },
    ])
  })

  it("does not match italic with whitespace inside delimiters", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ type: "text", text: "2 * 3 * 4" }])
  })

  it("renders a safe link", () => {
    expect(parseInline("[text](https://example.com)")).toEqual([
      {
        type: "link",
        href: "https://example.com/",
        children: [{ type: "text", text: "text" }],
      },
    ])
  })

  it("renders an unsafe link as literal text", () => {
    expect(parseInline("[click](javascript:alert(1))")).toEqual([
      { type: "text", text: "[click](javascript:alert(1))" },
    ])
  })

  it("converts single newline into a br node", () => {
    expect(parseInline("line one\nline two")).toEqual([
      { type: "text", text: "line one" },
      { type: "br" },
      { type: "text", text: "line two" },
    ])
  })

  it("handles bold followed by italic", () => {
    expect(parseInline("**a** and *b*")).toEqual([
      { type: "bold", children: [{ type: "text", text: "a" }] },
      { type: "text", text: " and " },
      { type: "italic", children: [{ type: "text", text: "b" }] },
    ])
  })

  it("ignores asterisks without closing delimiter", () => {
    expect(parseInline("just *one")).toEqual([{ type: "text", text: "just *one" }])
  })

  it("renders bold inside a link label", () => {
    expect(parseInline("[**Slack**](https://slack.com)")).toEqual([
      {
        type: "link",
        href: "https://slack.com/",
        children: [{ type: "bold", children: [{ type: "text", text: "Slack" }] }],
      },
    ])
  })
})

describe("parseRichText", () => {
  it("returns empty array for empty input", () => {
    expect(parseRichText("")).toEqual([])
  })

  it("renders a single paragraph", () => {
    expect(parseRichText("Hello.")).toEqual([
      { type: "paragraph", inlines: [{ type: "text", text: "Hello." }] },
    ])
  })

  it("splits paragraphs on blank lines", () => {
    expect(parseRichText("First.\n\nSecond.")).toEqual([
      { type: "paragraph", inlines: [{ type: "text", text: "First." }] },
      { type: "paragraph", inlines: [{ type: "text", text: "Second." }] },
    ])
  })

  it("groups consecutive bullet lines into one list", () => {
    expect(parseRichText("- one\n- two\n- three")).toEqual([
      {
        type: "list",
        items: [
          [{ type: "text", text: "one" }],
          [{ type: "text", text: "two" }],
          [{ type: "text", text: "three" }],
        ],
      },
    ])
  })

  it("supports paragraph then list", () => {
    expect(parseRichText("Intro.\n- A\n- B")).toEqual([
      { type: "paragraph", inlines: [{ type: "text", text: "Intro." }] },
      {
        type: "list",
        items: [
          [{ type: "text", text: "A" }],
          [{ type: "text", text: "B" }],
        ],
      },
    ])
  })

  it("supports inline formatting in list items", () => {
    expect(parseRichText("- **A** is bold\n- *B* is italic")).toEqual([
      {
        type: "list",
        items: [
          [
            { type: "bold", children: [{ type: "text", text: "A" }] },
            { type: "text", text: " is bold" },
          ],
          [
            { type: "italic", children: [{ type: "text", text: "B" }] },
            { type: "text", text: " is italic" },
          ],
        ],
      },
    ])
  })

  it("preserves Windows line endings", () => {
    expect(parseRichText("First\r\n\r\nSecond")).toEqual([
      { type: "paragraph", inlines: [{ type: "text", text: "First" }] },
      { type: "paragraph", inlines: [{ type: "text", text: "Second" }] },
    ])
  })
})
