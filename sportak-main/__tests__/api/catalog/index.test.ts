import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
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

describe("POST /api/catalog", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/catalog/index")
    handler = mod.default
  })

  it("returns 405 for non-POST methods", async () => {
    const req = { method: "GET", body: {} } as unknown as NextApiRequest
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq(VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 403 for participant", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq(VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  describe("as admin", () => {
    beforeEach(() => {
      getServerSession.mockResolvedValue({ user: { id: "u1", role: "admin" } })
    })

    it("returns 400 when name is missing", async () => {
      const req = mockReq({ ...VALID_BODY, name: "" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when unit is missing", async () => {
      const req = mockReq({ ...VALID_BODY, unit: "" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when pointsPerUnit is zero", async () => {
      const req = mockReq({ ...VALID_BODY, pointsPerUnit: 0 })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when pointsPerUnit is negative", async () => {
      const req = mockReq({ ...VALID_BODY, pointsPerUnit: -5 })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when category is invalid", async () => {
      const req = mockReq({ ...VALID_BODY, category: "food" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("returns 400 when challengeType is invalid", async () => {
      const req = mockReq({ ...VALID_BODY, challengeType: "AUTUMN" })
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it("creates catalog item successfully", async () => {
      const req = mockReq(VALID_BODY)
      const res = mockRes()
      await handler(req, res)
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })
})
