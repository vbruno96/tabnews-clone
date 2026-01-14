import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForWallServices();
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: `"Bruno Vinícius" <vbruno96@gmail.com>`,
      to: "mariavilarina@gmail.com",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: `"Bruno Vinícius" <vbruno96@gmail.com>`,
      to: "mariavilarina06@gmail.com",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail).toEqual({
      from: "<vbruno96@gmail.com>",
      to: "<mariavilarina06@gmail.com>",
      subject: "Último email enviado",
      text: "Corpo do último email.\r\n",
    });
  });
});
