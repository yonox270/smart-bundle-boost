import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";

export const action = async ({ request }) => {
  try {
    const { shop, payload } = await authenticate.webhook(request);
    console.log(`💰 [Billing] Subscription update for: ${shop}`);

    const subscription = payload.app_subscription;
    const status = subscription.status;

    await prisma.shop.update({
      where: { shopDomain: shop },
      data: {
        subscriptionStatus: status,
        planName: subscription.name,
      },
    });

    console.log(`✅ Shop ${shop} subscription updated to ${status}`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [Billing] Error:", error);
    return new Response("OK", { status: 200 });
  }
};