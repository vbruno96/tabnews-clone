import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import { InternalServerError } from "infra/errors";
import activation from "models/activation";
import webserver from "infra/webserver.js";

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
      const response = await fetch(`${webserver.origin}/api/v1/status`);
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

async function createUser(userObject) {
  return await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "ValidPassword",
  });
}

async function createSession(userObject) {
  return await session.create(userObject.id);
}

async function activateUser(userObject) {
  const activationToken = await activation.create(userObject.id);
  await activation.markTokenAsUsed(activationToken.id);
  return await activation.activateUserByUserId(userObject.id);
}

async function addFeaturesToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject.id, features);
  return updatedUser;
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
    if (emailListBody.length === 0) {
      return null;
    }

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

function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

const orchestrator = {
  activateUser,
  addFeaturesToUser,
  clearDatabase,
  createUser,
  createSession,
  extractUUID,
  getLastEmail,
  deleteAllEmails,
  runPendingMigrations,
  waitForWallServices,
};

export default orchestrator;
