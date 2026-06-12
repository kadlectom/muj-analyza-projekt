import { parseHowToContent, serializeHowToContent, EMPTY_HOW_TO } from "@/lib/howToContent"

describe("parseHowToContent", () => {
  it("returns empty sections for null or empty input", () => {
    expect(parseHowToContent(null)).toEqual(EMPTY_HOW_TO)
    expect(parseHowToContent(undefined)).toEqual(EMPTY_HOW_TO)
    expect(parseHowToContent("")).toEqual(EMPTY_HOW_TO)
  })

  it("returns empty sections for malformed JSON", () => {
    expect(parseHowToContent("not json")).toEqual(EMPTY_HOW_TO)
    expect(parseHowToContent("{broken")).toEqual(EMPTY_HOW_TO)
  })

  it("returns empty sections when 'sections' is missing or not an array", () => {
    expect(parseHowToContent("{}")).toEqual(EMPTY_HOW_TO)
    expect(parseHowToContent('{"sections":"oops"}')).toEqual(EMPTY_HOW_TO)
    expect(parseHowToContent('{"sections":123}')).toEqual(EMPTY_HOW_TO)
  })

  it("drops sections missing required string fields", () => {
    const raw = JSON.stringify({
      sections: [
        { id: "a", title: "T", body: "B" },          // keep
        { id: "b", title: "T2" },                     // drop (no body)
        { title: "T3", body: "B3" },                  // drop (no id)
        { id: 1, title: "T4", body: "B4" },           // drop (id not string)
        null,                                          // drop
      ],
    })
    const out = parseHowToContent(raw)
    expect(out.sections).toEqual([{ id: "a", title: "T", body: "B" }])
  })

  it("keeps only id/title/body fields, ignoring extras", () => {
    const raw = JSON.stringify({
      sections: [{ id: "a", title: "T", body: "B", extra: "nope" }],
    })
    const out = parseHowToContent(raw)
    expect(out.sections).toEqual([{ id: "a", title: "T", body: "B" }])
  })
})

describe("serializeHowToContent", () => {
  it("round-trips with parseHowToContent", () => {
    const input = { sections: [{ id: "x", title: "Úvod", body: "text\nmulti" }] }
    const serialized = serializeHowToContent(input)
    expect(parseHowToContent(serialized)).toEqual(input)
  })

  it("strips fields not in the HowToSection shape", () => {
    const input = {
      sections: [
        { id: "x", title: "T", body: "B", extra: "nope" } as unknown as {
          id: string
          title: string
          body: string
        },
      ],
    }
    const serialized = serializeHowToContent(input)
    expect(JSON.parse(serialized)).toEqual({
      sections: [{ id: "x", title: "T", body: "B" }],
    })
  })
})
