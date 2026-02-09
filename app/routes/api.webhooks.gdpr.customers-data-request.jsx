import { authenticate } from "~/shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, payload } = await authenticate.webhook(request);
    console.log(`📨 [GDPR] Data request for shop: ${shop}`);
    console.log("Customer ID:", payload.customer?.id);
    
    // TODO: En production, envoie email au support
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [GDPR] Error:", error);
    return new Response("OK", { status: 200 });
  }
};