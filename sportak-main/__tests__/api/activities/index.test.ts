import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/lib/auth", () => ({ authOptions: {} }))
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }))

const mockSelectFrom = jest.fn()
const mockSelectWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockInnerJoinWhere = jest.fn()

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation(() => ({
        where: mockSelectWhere,
        innerJoin: jest.fn().mockReturnValue({
          where: mockInnerJoinWhere.mockReturnValue({
            orderBy: mockOrderBy.mockResolvedValue([]),
          }),
        }),
      })),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    }),
  },
}))

const VALID_BODY = {
  challengeId: "ch-1",
  catalogItemId: "cat-1",
  value: 5,
  date: "2025-01-15",
  note: "test",
}

function mockReq(method: string, body?: Record<string, unknown>, query?: Record<string, string>): NextApiRequest {
  return { method, body: body ?? {}, query: query ?? {} } as unknown as NextApiRequest
}

function mockRes() {
  const res = {} as NextApiResponse
  const json = jest.fn().mockReturnValue(res)
  const status = jest.fn().mockReturnValue({ json, end: jest.fn() })
  const end = jest.fn()
  return Object.assign(res, { status, json, end })
}

describe("POST /api/activities", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/activities/index")
    handler = mod.default

    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })

    // Default mocks for POST flow:
    // 1. Challenge lookup
    // 2. Enrollment check
    // 3. Catalog item lookup
    mockSelectWhere
      .mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE", startDate: "2025-01-01", endDate: "2025-03-31" }])
      .mockResolvedValueOnce([{ userId: "u1" }]) // enrolled
      .mockResolvedValueOnce([{ id: "cat-1", pointsPerUnit: 2.5, isActive: true }])
  })

  it("returns 405 for PUT", async () => {
    const req = mockReq("PUT")
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq("POST", VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 400 when challengeId is missing", async () => {
    const req = mockReq("POST", { ...VALID_BODY, challengeId: undefined })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when value is not positive", async () => {
    const req = mockReq("POST", { ...VALID_BODY, value: 0 })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when date format is invalid", async () => {
    const req = mockReq("POST", { ...VALID_BODY, date: "15.01.2025" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 404 when challenge not found", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([])
    const req = mockReq("POST", VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it("returns 400 when challenge is not ACTIVE", async () => {
    mockSelectWhere.mockReset().mockResolvedValueOnce([{ id: "ch-1", status: "CLOSED", startDate: "2025-01-01", endDate: "2025-03-31" }])
    const req = mockReq("POST", VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when date is outside challenge range", async () => {
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE", startDate: "2025-01-01", endDate: "2025-03-31" }])
    const req = mockReq("POST", { ...VALID_BODY, date: "2025-04-01" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when user is not enrolled", async () => {
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE", startDate: "2025-01-01", endDate: "2025-03-31" }])
      .mockResolvedValueOnce([]) // not enrolled
    const req = mockReq("POST", VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it("returns 400 when catalog item is inactive", async () => {
    mockSelectWhere
      .mockReset()
      .mockResolvedValueOnce([{ id: "ch-1", status: "ACTIVE", startDate: "2025-01-01", endDate: "2025-03-31" }])
      .mockResolvedValueOnce([{ userId: "u1" }])
      .mockResolvedValueOnce([{ id: "cat-1", pointsPerUnit: 2.5, isActive: false }])
    const req = mockReq("POST", VALID_BODY)
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

})

describe("GET /api/activities", () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>
  let getServerSession: jest.Mock

  beforeEach(async () => {
    jest.resetModules()
    const nextAuth = await import("next-auth")
    getServerSession = nextAuth.getServerSession as jest.Mock
    const mod = await import("@/pages/api/activities/index")
    handler = mod.default

    mockOrderBy.mockResolvedValue([])
  })

  it("returns 401 when unauthenticated", async () => {
    getServerSession.mockResolvedValue(null)
    const req = mockReq("GET", undefined, { challengeId: "ch-1" })
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it("returns 400 when challengeId is missing", async () => {
    getServerSession.mockResolvedValue({ user: { id: "u1", role: "participant" } })
    const req = mockReq("GET", undefined, {})
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

})
