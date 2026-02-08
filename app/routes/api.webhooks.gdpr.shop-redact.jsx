import { authenticate } from "../../../shopify.server";
import prisma from "../../../db.server";

export const action = async ({ request }) => {
  try {
    const { shop } = await authenticate.webhook(request);
    console.log(`🗑️ [GDPR] Shop redact for: ${shop}`);

    const deleted = await prisma.shop.deleteMany({
      where: { shopDomain: shop },
    });

    console.log(`✅ Shop ${shop} deleted (${deleted.count} records)`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [GDPR] Error:", error);
    return new Response("OK", { status: 200 });
  }
};