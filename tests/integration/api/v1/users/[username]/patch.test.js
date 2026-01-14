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
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/UsuarioInexistente",
        {
          method: "PATCH",
        },
      );

      expect(response.status).toBe(404);
    });

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

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: testUser.id,
        username: "userupdated",
        email: testUser.email,
        features: [],
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

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${testUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        features: [],
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

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${testUser.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
        features: [],
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

      await orchestrator.createUser({
        username: "user2",
      });

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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

    test("With duplicated 'email'", async () => {
      await orchestrator.createUser({
        email: "useremail1@email.com",
      });

      const userTest2 = await orchestrator.createUser({
        email: "useremail2@email.com",
      });

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${userTest2.username}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
