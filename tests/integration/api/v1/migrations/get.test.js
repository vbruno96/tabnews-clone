import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForWallServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous User", () => {
    test("Retrieving pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migrations"',
        status_code: 403,
      });
    });
  });

  describe("Default User", () => {
    test("Without `read:migrations`", async () => {
      const testUser = await orchestrator.createUser();
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${testUserSessionObject.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:migrations"',
        status_code: 403,
      });
    });
  });

  describe("Privileged User", () => {
    test("With `read:migrations`", async () => {
      const testUser = await orchestrator.createUser();
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );
      await orchestrator.addFeaturesToUser(testUser, ["read:migrations"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${testUserSessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
