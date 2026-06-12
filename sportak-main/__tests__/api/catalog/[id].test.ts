import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))

const mockSelectWhere = jest.fn()
const mockUpdateSetWhere = jest.fn()

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: mockSelectWhere,
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: mockUpdateSetWhere,
      }),
    }),
  },
}))

const VALID_BODY = {
  name: "Běh",
  unit: "km",
  pointsPerUnit: 10,
  category: "sport",
  challengeType: "BOTH",
}

function mockReq(method: string, body: Record<string, unknown> = {}, id = "item-1"): NextApiRequest {
  return { method, body, query: { id } } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  const end = jest.fn()
  return Object.assign(res, { status, json, end })
}

describe("PATCH/DELETE /api/catalog/[id]", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/catalog/[id]")
    handler = mod.default

    // Default: item exists
    mockSelectWhere.mockResolvedValue([{ id: "item-1" }])
    mockUpdateSetWhere.mockResolvedValue(undefined)
  })

  it("returns 405 for unsupported methods", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
    const req = mockReq("GET")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when unauthenticated on DELETE", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 403 for participant on DELETE", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  describe("DELETE (soft-delete) as admin", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
    })

    it("returns 404 when item not found", async () => {
      mockSelectWhere.mockResolvedValue([])
      const req = mockReq("DELETE")
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    })

    it("returns 200 when item exists", async () => {
      const req = mockReq("DELETE")
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe("PATCH (edit) as admin", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
    })

    it("returns 400 when name is blank", async () => {
      const req = mockReq("PATCH", { ...VALID_BODY, name: "" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when pointsPerUnit is negative", async () => {
      const req = mockReq("PATCH", { ...VALID_BODY, pointsPerUnit: -1 })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when category is invalid", async () => {
      const req = mockReq("PATCH", { ...VALID_BODY, category: "xyz" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 404 when item not found", async () => {
      mockSelectWhere.mockResolvedValue([])
      const req = mockReq("PATCH", VALID_BODY)
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    })

    it("returns 200 on valid edit", async () => {
      const req = mockReq("PATCH", VALID_BODY)
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("returns 200 for reactivate shortcut (isActive: true only)", async () => {
      const req = mockReq("PATCH", { isActive: true })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
