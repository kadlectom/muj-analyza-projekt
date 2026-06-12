import type { NextApiRequest, NextApiResponse } from "next"

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/lib/auth", () => ({ authOptions: {} }))

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    }),
  },
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockReq(body: Record<string, unknown> = {}): NextApiRequest {
  return { method: "POST", body } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  const end = jest.fn()
  return Object.assign(res, { status, json, end })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("POST /api/challenges", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    // Re-require after reset so mocks apply cleanly
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/challenges/index")
    handler = mod.default
  })

  it("returns 405 for non-POST methods", async () => {
    const req = { method: "GET", body: {} } as unknown as NextApiRequest
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when not authenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq({ name: "Test", type: "WINTER", startDate: "2025-01-01", endDate: "2025-03-01" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 403 when authenticated as participant", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq({ name: "Test", type: "WINTER", startDate: "2025-01-01", endDate: "2025-03-01" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  describe("as admin", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
    })

    it("returns 400 when name is missing", async () => {
      const req = mockReq({ type: "WINTER", startDate: "2025-01-01", endDate: "2025-03-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when name is blank", async () => {
      const req = mockReq({ name: "   ", type: "WINTER", startDate: "2025-01-01", endDate: "2025-03-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when type is invalid", async () => {
      const req = mockReq({ name: "Test", type: "SPRING", startDate: "2025-01-01", endDate: "2025-03-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when startDate format is wrong", async () => {
      const req = mockReq({ name: "Test", type: "WINTER", startDate: "01-01-2025", endDate: "2025-03-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when startDate >= endDate", async () => {
      const req = mockReq({ name: "Test", type: "WINTER", startDate: "2025-03-01", endDate: "2025-01-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when startDate equals endDate", async () => {
      const req = mockReq({ name: "Test", type: "WINTER", startDate: "2025-01-01", endDate: "2025-01-01" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
