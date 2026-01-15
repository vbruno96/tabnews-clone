import database from "infra/database.js";
import email from "infra/email.js";
import { NotFoundError } from "infra/errors.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
  const newToken = await runInserQuery(userId, expiresAt);
  return newToken;

  async function runInserQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
      RETURNING
        *
    ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function markTokenAsUsed(token) {
  const activatedTokenObject = await runUpdateQuery(token);
  return activatedTokenObject;

  async function runUpdateQuery(token) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          updated_at = timezone('utc', now()),
          used_at = timezone('utc', now())
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        RETURNING
          *
      ;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

async function sendEmailToUser(user, token) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no FinTab.\n\n${webserver.origin}/cadastro/ativar/${token}\n\nAtenciosamente,\nEquipe FinTab`,
  });
}

async function findOneValidId(token) {
  const activationToken = await runSelectQuery(token);
  return activationToken;

  async function runSelectQuery(token) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
         user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [token],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, ["create:session"]);
  return activatedUser;
}

const activation = {
  activateUserByUserId,
  create,
  findOneValidId,
  markTokenAsUsed,
  sendEmailToUser,
};

export default activation;
