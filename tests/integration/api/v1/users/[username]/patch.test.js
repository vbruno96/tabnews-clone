import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import password from "models/password.js";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForWallServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous User", () => {
    test("With unique 'username'", async () => {
      const testUser = await orchestrator.createUser({
        username: "userupdate",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${testUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "userupdated",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default User", () => {
    test("With nonexistent 'username'", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const sessionObject = await orchestrator.createSession(createdUser.id);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);
    });

    test("With unique 'username'", async () => {
      const testUser = await orchestrator.createUser({
        username: "uniqueuserupdate",
      });
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${testUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${testUserSessionObject.token}`,
          },
          body: JSON.stringify({
            username: "uniqueuserupdated",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: testUser.id,
        username: "uniqueuserupdated",
        email: testUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: testUser.password,
        created_at: testUser.created_at.toJSON(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const testUser = await orchestrator.createUser({
        email: "userupdate.email@email.com",
      });
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${testUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${testUserSessionObject.token}`,
          },
          body: JSON.stringify({
            email: "userupdated.email@email.com",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: testUser.id,
        username: testUser.username,
        email: "userupdated.email@email.com",
        features: ["create:session", "read:session", "update:user"],
        password: testUser.password,
        created_at: testUser.created_at.toJSON(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("With new 'password'", async () => {
      const testUser = await orchestrator.createUser({
        password: "senha123",
      });
      await orchestrator.activateUser(testUser.id);
      const testUserSessionObject = await orchestrator.createSession(
        testUser.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${testUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${testUserSessionObject.token}`,
          },
          body: JSON.stringify({
            password: "senha12345",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: testUser.id,
        username: testUser.username,
        email: testUser.email,
        features: ["create:session", "read:session", "update:user"],
        password: responseBody.password,
        created_at: testUser.created_at.toJSON(),
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.findOneByUsername(
        responseBody.username,
      );
      const correctPasswordMatch = await password.compare(
        "senha12345",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated 'username'", async () => {
      await orchestrator.createUser({
        username: "user1",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user2",
      });
      await orchestrator.activateUser(createdUser2.id);
      const user2SessionObject = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user2SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("With 'user4' targeting 'user3'", async () => {
      await orchestrator.createUser({
        username: "user3",
      });

      const createdUser2 = await orchestrator.createUser({
        username: "user4",
      });
      await orchestrator.activateUser(createdUser2.id);
      const user2SessionObject = await orchestrator.createSession(
        createdUser2.id,
      );

      const response = await fetch("http://localhost:3000/api/v1/users/user1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user2SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "user5",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para atualizar outro usuário.",
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário.",
        status_code: 403,
      });
    });

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "useremail1@email.com",
      });

      const userTest2 = await orchestrator.createUser({
        email: "useremail2@email.com",
      });
      await orchestrator.activateUser(userTest2.id);
      const userTest2SessionObject = await orchestrator.createSession(
        userTest2.id,
      );

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userTest2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${userTest2SessionObject.token}`,
          },
          body: JSON.stringify({
            email: "useremail1@email.com",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
  });
});
