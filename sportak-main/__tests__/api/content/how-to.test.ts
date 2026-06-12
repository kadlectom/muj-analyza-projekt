import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))

const mockSelectWhereLimit = jest.fn()
const mockInsertValues = jest.fn()
const mockUpdateSetWhere = jest.fn()

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ limit: mockSelectWhereLimit }),
      }),
    }),
    insert: jest.fn().mockReturnValue({ values: mockInsertValues }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where: mockUpdateSetWhere }),
    }),
  },
}))

function mockReq(method: string, body: Record<string, unknown> = {}): NextApiRequest {
  return { method, body, query: {} } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  return Object.assign(res, { status, json })
}

describe("/api/content/how-to", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/content/how-to")
    handler = mod.default
    mockSelectWhereLimit.mockReset().mockResolvedValue([])
    mockInsertValues.mockReset().mockResolvedValue(undefined)
    mockUpdateSetWhere.mockReset().mockResolvedValue(undefined)
  })

  it("returns 405 for unsupported methods", async () => {
    const res = mockRes()
    await handler(mockReq("POST"), res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      getServerSession.mockResolvedValue(null)
      const res = mockRes()
      await handler(mockReq("GET"), res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it("returns empty sections when no row exists", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
      mockSelectWhereLimit.mockResolvedValue([])
      const res = mockRes()
      await handler(mockReq("GET"), res)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ sections: [] })
    })

    it("parses and returns stored sections", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
      mockSelectWhereLimit.mockResolvedValue([
        { data: JSON.stringify({ sections: [{ id: "a", title: "T", body: "B" }] }) },
      ])
      const res = mockRes()
      await handler(mockReq("GET"), res)
      expect(res.json).toHaveBeenCalledWith({
        sections: [{ id: "a", title: "T", body: "B" }],
      })
    })
  })

  describe("PUT", () => {
    it("returns 401 when unauthenticated", async () => {
      getServerSession.mockResolvedValue(null)
      const res = mockRes()
      await handler(mockReq("PUT", { sections: [] }), res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it("returns 403 for participant", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
      const res = mockRes()
      await handler(mockReq("PUT", { sections: [] }), res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it("returns 400 when 'sections' is not an array", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
      const res = mockRes()
      await handler(mockReq("PUT", { sections: "nope" }), res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when a section has empty title", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
      const res = mockRes()
      await handler(mockReq("PUT", { sections: [{ id: "a", title: "   ", body: "B" }] }), res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("inserts when no row exists", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
      mockSelectWhereLimit.mockResolvedValue([])
      const res = mockRes()
      await handler(
        mockReq("PUT", { sections: [{ id: "a", title: "T", body: "B" }] }),
        res,
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(mockInsertValues).toHaveBeenCalled()
      expect(mockUpdateSetWhere).not.toHaveBeenCalled()
    })

    it("updates when row exists", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
      mockSelectWhereLimit.mockResolvedValue([{ key: "how_to" }])
      const res = mockRes()
      await handler(
        mockReq("PUT", { sections: [{ id: "a", title: "T", body: "B" }] }),
        res,
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(mockUpdateSetWhere).toHaveBeenCalled()
      expect(mockInsertValues).not.toHaveBeenCalled()
    })

    it("assigns uuid to sections missing id", async () => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
      mockSelectWhereLimit.mockResolvedValue([])
      const res = mockRes()
      await handler(mockReq("PUT", { sections: [{ title: "T", body: "B" }] }), res)
      expect(res.status).toHaveBeenCalledWith(200)
      const returned = (res.json as jest.Mock).mock.calls[0][0] as {
        sections: { id: string }[]
      }
      expect(typeof returned.sections[0].id).toBe("string")
      expect(returned.sections[0].id.length).toBeGreaterThan(0)
    })
  })
})
