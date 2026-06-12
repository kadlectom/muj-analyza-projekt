import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))

const mockSelectWhere = jest.fn()
const mockGroupBy = jest.fn()

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        where: mockSelectWhere,
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: mockGroupBy.mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      })),
    }),
  },
}))

function mockReq(query: Record<string, string> = {}): NextApiRequest {
  return { method: "GET", query } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  const end = jest.fn()
  return Object.assign(res, { status, json, end })
}

describe("GET /api/leaderboard", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/leaderboard/index")
    handler = mod.default

    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })

    // Default: challenge exists and is ACTIVE
    mockSelectWhere.mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE" }])
  })

  it("returns 405 for POST", async () => {
    const req = { method: "POST", query: {} } as unknown as NextApiRequest
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq({ challengeId: "ch-1" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 400 when challengeId is missing", async () => {
    const req = mockReq({})
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 404 when challenge not found", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([])
    const req = mockReq({ challengeId: "ch-999" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("returns 403 for DRAFT challenge as participant", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([{ id: "ch-1", status: "DRAFT" }])
    const req = mockReq({ challengeId: "ch-1" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

})
