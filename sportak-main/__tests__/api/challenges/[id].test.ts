import type { NextApiRequest, NextApiResponse } from "next"

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/auth", () => ({ authOptions: {} }))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

// DB mock — configurable per test via module-level refs
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockReq(body: Record<string, unknown> = {}, id = "chal-1"): NextApiRequest {
  return { method: "PATCH", body, query: { id } } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  const end = jest.fn()
  return Object.assign(res, { status, json, end })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("PATCH /api/challenges/[id]", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/challenges/[id]")
    handler = mod.default

    // Default DB — returns a DRAFT challenge
    mockSelectWhere.mockResolvedValue([{ status: "DRAFT" }])
    mockUpdateSetWhere.mockResolvedValue(undefined)
  })

  it("returns 405 for non-PATCH methods", async () => {
    const req = { method: "GET", body: {}, query: { id: "x" } } as unknown as NextApiRequest
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq({ status: "ACTIVE" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 403 for participant", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq({ status: "ACTIVE" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  describe("as admin — status transition", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
    })

    it("returns 400 for invalid target status", async () => {
      const req = mockReq({ status: "ARCHIVED" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when transition is not allowed (ACTIVE → DRAFT)", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "ACTIVE" }])
      const req = mockReq({ status: "ACTIVE" }) // ACTIVE → ACTIVE is not allowed
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 409 when challenge is CLOSED", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "CLOSED" }])
      const req = mockReq({ status: "ACTIVE" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(409)
    })

    it("returns 409 when challenge is ARCHIVED", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "ARCHIVED" }])
      const req = mockReq({ status: "ACTIVE" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(409)
    })

    it("returns 404 when challenge not found", async () => {
      mockSelectWhere.mockResolvedValue([])
      const req = mockReq({ status: "ACTIVE" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    })

    it("allows DRAFT → ACTIVE transition", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "DRAFT" }])
      const req = mockReq({ status: "ACTIVE" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("allows ACTIVE → CLOSED transition", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "ACTIVE" }])
      const req = mockReq({ status: "CLOSED" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe("as admin — field edit", () => {
    const validBody = {
      name: "Updated Challenge",
      type: "SUMMER",
      startDate: "2025-06-01",
      endDate: "2025-08-31",
    }

    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
      mockSelectWhere.mockResolvedValue([{ status: "DRAFT" }])
    })

    it("returns 400 when name is missing", async () => {
      const req = mockReq({ ...validBody, name: "" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when type is invalid", async () => {
      const req = mockReq({ ...validBody, type: "AUTUMN" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when startDate >= endDate", async () => {
      const req = mockReq({ ...validBody, startDate: "2025-09-01", endDate: "2025-08-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 409 when challenge is CLOSED", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "CLOSED" }])
      const req = mockReq(validBody)
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(409)
    })

    it("returns 200 on valid edit of DRAFT challenge", async () => {
      const req = mockReq(validBody)
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it("returns 200 on valid edit of ACTIVE challenge", async () => {
      mockSelectWhere.mockResolvedValue([{ status: "ACTIVE" }])
      const req = mockReq(validBody)
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
