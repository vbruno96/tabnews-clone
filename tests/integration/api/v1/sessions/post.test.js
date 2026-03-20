import { version as uuidVersion } from "uuid";
import setCookieParser from "set-cookie-parser";

import orchestrator from "tests/orchestrator.js";
import session from "models/session.js";

beforeAll(async () => {
  await orchestrator.waitForWallServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous User", () => {
    test("With incorrect 'email' but correct 'password'", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "incorrect.email@email.com",
          password: "senha-correta",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect 'password' but correct 'email'", async () => {
      await orchestrator.createUser({
        email: "correct.email@email.com",
        password: "senha-icorreta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "correct.email@email.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect 'email' and incorrect 'password'", async () => {
      await orchestrator.createUser();

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "icorrect.email@email.com",
          password: "incorrect-password",
        }),
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct 'email' and correct 'password'", async () => {
      const user = await orchestrator.createUser({
        email: "all.correct@email.com",
        password: "all-correct",
      });

      await orchestrator.activateUser(user.id);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "all.correct@email.com",
          password: "all-correct",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: user.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.user_id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(session.EXPIRATION_IN_MILISECONDS);

      const parsedCookie = setCookieParser(response, { map: true });
      expect(parsedCookie.session_id).toEqual({
        name: "session_id",
        value: responseBody.token,
        maxAge: session.EXPIRATION_IN_MILISECONDS / 1000, // 30 Days in seconds
        path: "/",
        httpOnly: true,
      });
    });
  });
});
