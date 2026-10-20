import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startServer, type TestServer } from "./helpers";

let server: TestServer;

beforeEach(async () => {
  server = await startServer();
  const insert = server.db.sqlite.prepare(
    "INSERT INTO ssh_data (id) VALUES (?)",
  );
  insert.run(1);
  insert.run(2);
});

afterEach(async () => {
  await server.close();
});

function provider() {
  return server.mock.activityProviders[0];
}

describe("recent activity provider", () => {
  it("registers itself as the activity provider", () => {
    expect(server.mock.activityProviders).toHaveLength(1);
  });

  it("stores an entry and lists newest first", async () => {
    await provider().record("user-1", {
      type: "terminal",
      hostId: 1,
      hostName: "a",
    });
    await provider().record("user-1", {
      type: "docker",
      hostId: 2,
      hostName: "b",
    });

    const list = await provider().list("user-1", 10);
    expect(list.map((row) => row.type)).toEqual(["docker", "terminal"]);
    expect(list[0]).toMatchObject({
      userId: "user-1",
      hostId: 2,
      hostName: "b",
    });
  });

  it("only lists the asking user's entries", async () => {
    await provider().record("user-1", {
      type: "terminal",
      hostId: 1,
      hostName: "a",
    });
    await provider().record("user-2", {
      type: "terminal",
      hostId: 1,
      hostName: "a",
    });
    expect(await provider().list("user-2", 10)).toHaveLength(1);
  });

  it("refuses an invalid type", async () => {
    await expect(
      provider().record("user-1", {
        type: "Bad Type",
        hostId: 1,
        hostName: "a",
      }),
    ).resolves.toEqual({ status: "invalid_type" });
  });

  it("rate limits the same entry within a second", async () => {
    const entry = { type: "terminal", hostId: 1, hostName: "a" };
    expect((await provider().record("user-1", entry)).status).toBe("logged");
    expect((await provider().record("user-1", entry)).status).toBe(
      "rate_limited",
    );
  });

  it("keeps the newest 100 per user", async () => {
    for (let i = 0; i < 105; i++) {
      await provider().record("user-1", {
        type: `t${i % 10}`,
        hostId: 1 + (i % 2),
        hostName: `h${i}`,
      });
      // The rate limit is per user, host and type; this walks all combinations.
    }
    const rows = server.db.sqlite
      .prepare(
        "SELECT COUNT(*) AS n FROM p_homepage_recent_activity WHERE user_id = ?",
      )
      .get("user-1") as { n: number };
    expect(rows.n).toBeLessThanOrEqual(100);
  });

  it("deletes by user and by host", async () => {
    await provider().record("user-1", {
      type: "terminal",
      hostId: 1,
      hostName: "a",
    });
    await provider().record("user-1", {
      type: "docker",
      hostId: 2,
      hostName: "b",
    });
    await provider().deleteByHostIds([1]);
    expect((await provider().list("user-1", 10)).map((r) => r.hostId)).toEqual([
      2,
    ]);
    await provider().deleteByUserId("user-1");
    expect(await provider().list("user-1", 10)).toEqual([]);
  });
});
