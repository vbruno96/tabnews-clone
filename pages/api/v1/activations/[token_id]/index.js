import controller from "infra/controller.js";
import activation from "models/activation.js";
import { createRouter } from "next-connect";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), pathHandler);

export default router.handler(controller.errorHandlers);

async function pathHandler(request, response) {
  const tokenId = request.query.token_id;

  const validActivationToken = await activation.findOneValidId(tokenId);
  await activation.activateUserByUserId(validActivationToken.user_id);

  const usedActivationToken = await activation.markTokenAsUsed(tokenId);

  return response.status(200).json(usedActivationToken);
}
