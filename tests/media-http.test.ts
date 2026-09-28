import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  }),
}));
vi.mock("@/lib/supabase/config", () => ({
  getSupabaseConfig: () => ({ url: "https://test.supabase.co", key: "test" }),
}));
import {
  mediaSession,
  readBoundedBody,
  reserveMediaOperation,
} from "@/lib/media-http";
beforeEach(() => {
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "trusted" } },
    error: null,
  });
});
it("uses the incoming Host for Next.js localhost normalization without accepting cross-site origins", async () => {
  const request = new Request("http://localhost:3000/api/resume/extract", {
    headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
  });
  expect((await mediaSession(request)).user.id).toBe("trusted");
  await expect(
    mediaSession(
      new Request(request.url, {
        headers: { origin: "https://evil.example", host: "127.0.0.1:3000" },
      }),
    ),
  ).rejects.toMatchObject({ status: 403 });
});
it("requires a validated session", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(
    mediaSession(new Request("http://localhost/api/resume/extract")),
  ).rejects.toMatchObject({ status: 401 });
});
it("bounds actual bytes even without Content-Length", async () => {
  await expect(
    readBoundedBody(
      new Request("http://localhost", { method: "POST", body: "abcdef" }),
      5,
    ),
  ).rejects.toMatchObject({ status: 413 });
});
it("turns duplicate or exhausted reservations into explicit errors", async () => {
  const client = { rpc: mocks.rpc } as unknown as Parameters<
    typeof reserveMediaOperation
  >[0];
  mocks.rpc.mockResolvedValue({
    data: [{ accepted: false, reason: "duplicate" }],
    error: null,
  });
  await expect(
    reserveMediaOperation(client, "vision", crypto.randomUUID()),
  ).rejects.toMatchObject({ status: 409 });
  mocks.rpc.mockResolvedValue({
    data: [{ accepted: false, reason: "limit" }],
    error: null,
  });
  await expect(
    reserveMediaOperation(client, "vision", crypto.randomUUID()),
  ).rejects.toMatchObject({ status: 429 });
});
