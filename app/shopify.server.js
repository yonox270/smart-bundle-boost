import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
  LATEST_API_VERSION,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  webhooks: {
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/gdpr/customers-data-request",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/gdpr/customers-redact",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/gdpr/shop-redact",
    },
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/app-subscription-update",
    },
  },
  hooks: {
  afterAuth: async ({ session }) => {
    shopify.registerWebhooks({ session });
    console.log(`✅ Shop ${session.shop} installed`);
    try {
      await prisma.shop.upsert({
        where: { shopDomain: session.shop },
        update: {
          accessToken: session.accessToken,
          scope: session.scope || "",
        },
        create: {
          shopDomain: session.shop,
          accessToken: session.accessToken,
          scope: session.scope || "",
        },
      });
      console.log(`✅ Shop ${session.shop} saved to DB`);
    } catch (error) {
      console.error("❌ Error saving shop:", error);
    }
  },
},
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true,
  },
});

export default shopify;
export const apiVersion = LATEST_API_VERSION;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = new PrismaSessionStorage(prisma);