import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForWallServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous User", () => {
    test("Running pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
      });
      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "create:migrations"',
        status_code: 403,
      });
    });
  });

  describe("Default User", () => {
    test("Running pending migrations", async () => {
      const testUser = await orchestrator.createUser();
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${testUserSessionObject.token}`,
        },
      });
      const responseBody = await response.json();

      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action:
          'Verifique se o seu usuário possui a feature "create:migrations"',
        status_code: 403,
      });
    });
  });

  describe("Privileged User", () => {
    test("With `create:migrations`", async () => {
      const testUser = await orchestrator.createUser();
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );
      await orchestrator.addFeaturesToUser(testUser, ["create:migrations"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
        headers: {
          Cookie: `session_id=${testUserSessionObject.token}`,
        },
      });
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(responseBody)).toBe(true);
    });
  });
});
