import database from "infra/database";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

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

async function sendEmailToUser(user, token) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no FinTab.\n\n${webserver.origin}/cadastro/ativar/${token}\n\nAtenciosamente,\nEquipe FinTab`,
  });
}

async function findOneByUserId(userId) {
  const activationToken = await runSelectQuery(userId);
  return activationToken;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
         user_activation_tokens
        WHERE
          user_id = $1
      ;`,
      values: [userId],
    });
    return results.rows[0];
  }
}

const activation = {
  create,
  findOneByUserId,
  sendEmailToUser,
};

export default activation;
