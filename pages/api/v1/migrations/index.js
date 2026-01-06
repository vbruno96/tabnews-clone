import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database.js";
import controller from "infra/controller";

const router = createRouter();

let dbClient;

router.get(getHandler).post(postHandler);

export default router.handler(controller.errorHandlers);

const migrationOptions = {
  dir: resolve("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(_, response) {
  try {
    dbClient = await database.getNewClient();
    const pendingMigrations = await migrationRunner({
      ...migrationOptions,
      dbClient,
      dryRun: true,
    });

    return response.status(200).json(pendingMigrations);
  } finally {
    dbClient.end();
  }
}

async function postHandler(_, response) {
  try {
    dbClient = await database.getNewClient();

    const migratedMigrations = await migrationRunner({
      ...migrationOptions,
      dbClient,
    });

    if (migratedMigrations.length > 0) {
      dbClient.end();
      return response.status(201).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
  } finally {
    dbClient.end();
  }
}
