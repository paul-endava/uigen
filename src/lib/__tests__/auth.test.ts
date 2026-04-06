// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify, SignJWT } from "jose";

// Must be mocked before importing auth.ts
vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
const mockCookieDelete = vi.fn();
const mockCookieGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: mockCookieSet,
      get: mockCookieGet,
      delete: mockCookieDelete,
    })
  ),
}));

// Import after mocks are in place
const { createSession, getSession } = await import("@/lib/auth");

async function mintToken(
  payload: Record<string, unknown>,
  expirationTime = "7d"
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

test("sets auth-token cookie with correct name and options in development", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();

  const [cookieName, , options] = mockCookieSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
  expect(options.secure).toBe(false); // NODE_ENV is not "production" in tests
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("sets cookie as secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");

  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(true);
});

test("cookie expiry is approximately 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockCookieSet.mock.calls[0];
  const expiresAt: Date = options.expires;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expiresAt.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("JWT payload contains userId and email", async () => {
  await createSession("user-abc", "hello@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-abc");
  expect(payload.email).toBe("hello@example.com");
});

test("JWT payload contains expiresAt", async () => {
  await createSession("user-abc", "hello@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.expiresAt).toBeDefined();
  const expiresAt = new Date(payload.expiresAt as string);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + sevenDaysMs - 5000);
});

test("JWT is signed with HS256", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  // Decode the header (first segment of the JWT)
  const header = JSON.parse(
    Buffer.from(token.split(".")[0], "base64url").toString()
  );
  expect(header.alg).toBe("HS256");
});

test("generates a different token for each call", async () => {
  await createSession("user-1", "a@example.com");
  const [, token1] = mockCookieSet.mock.calls[0];

  vi.clearAllMocks();

  await createSession("user-2", "b@example.com");
  const [, token2] = mockCookieSet.mock.calls[0];

  expect(token1).not.toBe(token2);
});

// --- getSession ---

test("returns null when no auth-token cookie is present", async () => {
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns null when cookie value is undefined", async () => {
  mockCookieGet.mockReturnValue({ value: undefined });

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns null for an invalid (garbage) token", async () => {
  mockCookieGet.mockReturnValue({ value: "not.a.jwt" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns null for a token signed with a different secret", async () => {
  const wrongSecret = new TextEncoder().encode("wrong-secret");
  const token = await new SignJWT({ userId: "u1", email: "a@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(wrongSecret);

  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns null for an expired token", async () => {
  const alreadyExpired = Math.floor(Date.now() / 1000) - 10;
  const token = await new SignJWT({ userId: "u1", email: "a@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(alreadyExpired)
    .setIssuedAt()
    .sign(JWT_SECRET);

  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("returns session payload with userId and email for a valid token", async () => {
  const token = await mintToken({ userId: "user-42", email: "me@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).not.toBeNull();
  expect(session!.userId).toBe("user-42");
  expect(session!.email).toBe("me@example.com");
});

test("reads the auth-token cookie by name", async () => {
  mockCookieGet.mockReturnValue(undefined);

  await getSession();

  expect(mockCookieGet).toHaveBeenCalledWith("auth-token");
});
