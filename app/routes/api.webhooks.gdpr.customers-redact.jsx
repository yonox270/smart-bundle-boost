import { authenticate } from "~/shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, payload } = await authenticate.webhook(request);
    console.log(`🗑️ [GDPR] Customer redact for shop: ${shop}`);
    console.log("Customer ID:", payload.customer?.id);
    
    // On ne stocke pas de données client directement
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [GDPR] Error:", error);
    return new Response("OK", { status: 200 });
  }
};