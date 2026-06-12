import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))
jest.mock("@/lib/audit", () => ({ writeAuditLog: jest.fn().mockResolvedValue(undefined) }))

const mockSelectWhere = jest.fn()
const mockUpdateSetWhere = jest.fn()
const mockDeleteWhere = jest.fn()

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: mockSelectWhere,
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: mockUpdateSetWhere.mockResolvedValue(undefined),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      where: mockDeleteWhere.mockResolvedValue(undefined),
    }),
  },
}))

const ACTIVITY = {
  id: "act-1",
  userId: "u1",
  challengeId: "ch-1",
  catalogItemId: "cat-1",
  value: 5,
  points: 12.5,
  date: "2025-01-15",
  note: null,
  createdAt: new Date(),
  createdById: "u1",
}

function mockReq(method: string, body?: Record<string, unknown>, id = "act-1"): NextApiRequest {
  return { method, body: body ?? {}, query: { id } } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  const end = jest.fn()
  return Object.assign(res, { status, json, end })
}

describe("PATCH /api/activities/[id]", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/activities/[id]")
    handler = mod.default

    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })

    // Reset and set up default mock chain for PATCH flow
    mockSelectWhere.mockReset()
    mockSelectWhere
      .mockResolvedValueOnce([ACTIVITY]) // activity
      .mockResolvedValueOnce([{ status: "ACTIVE", startDate: "2025-01-01", endDate: "2025-03-31" }]) // challenge
      .mockResolvedValueOnce([{ pointsPerUnit: 2.5 }]) // catalog (for recalc)
  })

  it("returns 405 for GET", async () => {
    const req = mockReq("GET")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq("PATCH", { value: 10 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 404 when activity not found", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([])
    const req = mockReq("PATCH", { value: 10 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("returns 403 when participant tries to edit others activity", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([{ ...ACTIVITY, userId: "u2" }])
    const req = mockReq("PATCH", { value: 10 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it("returns 400 when challenge is not ACTIVE", async () => {
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([ACTIVITY])
      .mockResolvedValueOnce([{ status: "CLOSED", startDate: "2025-01-01", endDate: "2025-03-31" }])
    const req = mockReq("PATCH", { value: 10 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when value is not positive", async () => {
    const req = mockReq("PATCH", { value: -1 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when date is outside range", async () => {
    const req = mockReq("PATCH", { date: "2025-05-01" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when no changes provided", async () => {
    const req = mockReq("PATCH", {})
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 200 on valid edit with recalculated points", async () => {
    const req = mockReq("PATCH", { value: 10 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    const jsonCall = (res.status as jest.Mock).mock.results[0].value.json
    // 10 * 2.5 = 25
    expect(jsonCall).toHaveBeenCalledWith(expect.objectContaining({ points: 25 }))
  })

  it("writes audit log when admin edits another users activity", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin1", role: "admin" } })
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([{ ...ACTIVITY, userId: "u2" }]) // other user's activity
      .mockResolvedValueOnce([{ status: "ACTIVE", startDate: "2025-01-01", endDate: "2025-03-31" }])
      .mockResolvedValueOnce([{ pointsPerUnit: 2.5 }])

    const req = mockReq("PATCH", { value: 10 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)

    const { writeAuditLog } = await import("@/lib/audit")
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin1", action: "UPDATE", targetType: "activity" })
    )
  })
})

describe("DELETE /api/activities/[id]", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/activities/[id]")
    handler = mod.default

    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })

    mockSelectWhere.mockReset()
    mockSelectWhere
      .mockResolvedValueOnce([ACTIVITY])
      .mockResolvedValueOnce([{ status: "ACTIVE" }])
  })

  it("returns 404 when activity not found", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([])
    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("returns 403 when participant tries to delete others activity", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([{ ...ACTIVITY, userId: "u2" }])
    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it("returns 400 when challenge is CLOSED", async () => {
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([ACTIVITY])
      .mockResolvedValueOnce([{ status: "CLOSED" }])
    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 200 on successful delete", async () => {
    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("writes audit log when admin deletes another users activity", async () => {
    getServerSession.mockResolvedValue({ user: { id: "admin1", role: "admin" } })
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([{ ...ACTIVITY, userId: "u2" }])
      .mockResolvedValueOnce([{ status: "ACTIVE" }])

    const req = mockReq("DELETE")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)

    const { writeAuditLog } = await import("@/lib/audit")
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: "admin1", action: "DELETE", targetType: "activity" })
    )
  })
})
