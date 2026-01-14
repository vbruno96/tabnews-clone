import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import { InternalServerError } from "infra/errors";

const emailUrl = `${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function waitForWallServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailApi, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailApi() {
      const response = await fetch(emailUrl);
      if (response.status !== 200) {
        throw new InternalServerError();
      }
    }
  }
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userData) {
  return await user.create({
    username:
      userData?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userData?.email || faker.internet.email(),
    password: userData?.password || "ValidPassword",
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(
    `${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/messages`,
    {
      method: "DELETE",
    },
  );
}

async function getLastEmail() {
  try {
    const emailListResponse = await fetch(`${emailUrl}/messages`);
    const emailListBody = await emailListResponse.json();
    const { id, sender, recipients, subject } = emailListBody.pop();

    const emailTextResponse = await fetch(`${emailUrl}/messages/${id}.plain`);
    const emailTextBody = await emailTextResponse.text();

    return {
      from: sender,
      to: recipients[0],
      subject,
      text: emailTextBody,
    };
  } catch (error) {
    throw new InternalServerError({
      cause: error,
    });
  }
}

const orchestrator = {
  clearDatabase,
  createUser,
  createSession,
  getLastEmail,
  deleteAllEmails,
  runPendingMigrations,
  waitForWallServices,
};

export default orchestrator;
