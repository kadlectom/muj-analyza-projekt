import { slugify, uniqueSlug } from "@/lib/slugify"

describe("slugify", () => {
  it("strips Czech diacritics", () => {
    expect(slugify("Zimní výzva 2026")).toBe("zimni-vyzva-2026")
    expect(slugify("Běh přes poušť")).toBe("beh-pres-poust")
  })

  it("lowercases and collapses non-alphanumerics to single hyphens", () => {
    expect(slugify("Letní výzva — speciální edice!!!")).toBe("letni-vyzva-specialni-edice")
  })

  it("trims leading and trailing hyphens", () => {
    expect(slugify("   Hello, world!   ")).toBe("hello-world")
  })

  it("returns an empty string for input without alphanumerics", () => {
    expect(slugify("!!! --- ???")).toBe("")
  })
})

describe("uniqueSlug", () => {
  it("returns the base slug when nothing is taken", () => {
    expect(uniqueSlug("Zimní výzva", new Set())).toBe("zimni-vyzva")
  })

  it("appends a counter starting at 2 when the base is taken", () => {
    expect(uniqueSlug("Zimní výzva", new Set(["zimni-vyzva"]))).toBe("zimni-vyzva-2")
    expect(
      uniqueSlug("Zimní výzva", new Set(["zimni-vyzva", "zimni-vyzva-2"]))
    ).toBe("zimni-vyzva-3")
  })

  it("uses the fallback when the name produces an empty slug", () => {
    expect(uniqueSlug("!!!", new Set())).toBe("vyzva")
    expect(uniqueSlug("!!!", new Set(["vyzva"]))).toBe("vyzva-2")
  })
})
