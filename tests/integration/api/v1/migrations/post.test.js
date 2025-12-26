import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForWallServices();
  await orchestrator.clearDatabase();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous User", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response1 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        const response1Body = await response1.json();

        expect(response1.status).toBe(201);
        expect(response1Body.length).toBeGreaterThan(0);
      });

      test("For the second time", async () => {
        const response2 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          },
        );
        const response2Body = await response2.json();

        expect(response2.status).toBe(200);
        expect(response2Body.length).toBe(0);
      });
    });
  });
});
