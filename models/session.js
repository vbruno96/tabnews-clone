import crypto from "node:crypto";
import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILISECONDS = 60 * 60 * 24 * 30 * 1000; // 30 Days in miliseconds

async function create(userId) {
  const expiresAt = getExpiresAtValue();
  const token = crypto.randomBytes(48).toString("hex");

  const newSession = await runInserQuery(token, userId, expiresAt);

  return newSession;

  async function runInserQuery(token, userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          sessions (token, user_id, expires_at)
        VALUES
          ($1, $2, $3)
        RETURNING
          *
        ;`,
      values: [token, userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidByToken(sessionToken) {
  const results = await database.query({
    text: `
      SELECT
        *
      FROM
        sessions
      WHERE
        token = $1
        AND expires_at > NOW()
      LIMIT
        1
    ;`,
    values: [sessionToken],
  });

  if (results.rowCount === 0) {
    throw new UnauthorizedError({
      message: "Usuário não possui sessão ativa.",
      action: "Verifique se este ussuário está logado e tente novamente.",
    });
  }

  return results.rows[0];
}

async function renew(sessionId) {
  const expiresAt = getExpiresAtValue();
  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);

  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = $2,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      ;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

function getExpiresAtValue() {
  return new Date(Date.now() + EXPIRATION_IN_MILISECONDS);
}

const session = {
  create,
  findOneValidByToken,
  renew,
  EXPIRATION_IN_MILISECONDS,
};

export default session;
