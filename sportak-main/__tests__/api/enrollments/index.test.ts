import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))

const mockSelectWhere = jest.fn()

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: mockSelectWhere,
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    }),
  },
}))

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

describe("POST /api/enrollments", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/enrollments/index")
    handler = mod.default

    // Default: challenge exists and is ACTIVE, no existing enrollment
    mockSelectWhere
      .mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE" }]) // challenge lookup
      .mockResolvedValueOnce([]) // enrollment check
  })

  it("returns 405 for GET", async () => {
    const req = { method: "GET", body: {} } as unknown as NextApiRequest
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
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq({})
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 404 when challenge not found", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    mockSelectWhere.mockReset().mockResolvedValueOnce([]) // no challenge
    const req = mockReq({ challengeId: "ch-999" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("returns 400 when challenge is not ACTIVE", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    mockSelectWhere.mockReset().mockResolvedValueOnce([{ id: "ch-1", status: "DRAFT" }])
    const req = mockReq({ challengeId: "ch-1" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 409 when already enrolled", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE" }])
      .mockResolvedValueOnce([{ userId: "u1" }]) // already enrolled
    const req = mockReq({ challengeId: "ch-1" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it("returns 201 on successful enrollment", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq({ challengeId: "ch-1" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
