import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function waitForWallServices() {
  await waitForWebServer();

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

const orchestrator = {
  clearDatabase,
  createUser,
  runPendingMigrations,
  waitForWallServices,
};

export default orchestrator;
