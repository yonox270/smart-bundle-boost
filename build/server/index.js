var _a;
import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import "@shopify/shopify-app-remix/adapters/node";
import { shopifyApp, DeliveryMethod, AppDistribution, LATEST_API_VERSION } from "@shopify/shopify-app-remix/server";
import { MemorySessionStorage } from "@shopify/shopify-api";
import { PrismaClient } from "@prisma/client";
import { Page, Layout, InlineGrid, Card, BlockStack, Text, Banner, List, Button, IndexTable, Badge, FormLayout, TextField, Select, InlineStack, AppProvider } from "@shopify/polaris";
import { useState } from "react";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
function App() {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {}),
      /* @__PURE__ */ jsx("script", { src: "https://cdn.shopify.com/shopifycloud/app-bridge.js" })
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App
}, Symbol.toStringTag, { value: "Module" }));
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new MemorySessionStorage(),
  distribution: AppDistribution.AppStore,
  webhooks: {
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/gdpr/customers-data-request"
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/gdpr/customers-redact"
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/gdpr/shop-redact"
    },
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks/app-subscription-update"
    }
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
      console.log(`Shop ${session.shop} installed`);
    }
  },
  future: {
    v3_webhookAdminContext: true,
    v3_authenticatePublic: true
  }
});
shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
shopify.unauthenticated;
shopify.login;
shopify.registerWebhooks;
const action$3 = async ({ request }) => {
  var _a2;
  try {
    const { shop, payload } = await authenticate.webhook(request);
    console.log(`📨 [GDPR] Data request for shop: ${shop}`);
    console.log("Customer ID:", (_a2 = payload.customer) == null ? void 0 : _a2.id);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [GDPR] Error:", error);
    return new Response("OK", { status: 200 });
  }
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3
}, Symbol.toStringTag, { value: "Module" }));
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  if (!global.prisma) {
    global.prisma = prisma;
  }
}
const action$2 = async ({ request }) => {
  try {
    const { shop, payload } = await authenticate.webhook(request);
    console.log(`💰 [Billing] Subscription update for: ${shop}`);
    const subscription = payload.app_subscription;
    const status = subscription.status;
    await prisma.shop.update({
      where: { shopDomain: shop },
      data: {
        subscriptionStatus: status,
        planName: subscription.name
      }
    });
    console.log(`✅ Shop ${shop} subscription updated to ${status}`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [Billing] Error:", error);
    return new Response("OK", { status: 200 });
  }
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2
}, Symbol.toStringTag, { value: "Module" }));
const action$1 = async ({ request }) => {
  var _a2;
  try {
    const { shop, payload } = await authenticate.webhook(request);
    console.log(`🗑️ [GDPR] Customer redact for shop: ${shop}`);
    console.log("Customer ID:", (_a2 = payload.customer) == null ? void 0 : _a2.id);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [GDPR] Error:", error);
    return new Response("OK", { status: 200 });
  }
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1
}, Symbol.toStringTag, { value: "Module" }));
const action = async ({ request }) => {
  try {
    const { shop } = await authenticate.webhook(request);
    console.log(`🗑️ [GDPR] Shop redact for: ${shop}`);
    const deleted = await prisma.shop.deleteMany({
      where: { shopDomain: shop }
    });
    console.log(`✅ Shop ${shop} deleted (${deleted.count} records)`);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ [GDPR] Error:", error);
    return new Response("OK", { status: 200 });
  }
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const loader$3 = async ({ request }) => {
  return json({
    totalViews: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    bundles: []
  });
};
function Analytics() {
  const { totalViews, totalClicks, totalConversions, totalRevenue, bundles } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Analytics", backAction: { url: "/app" }, children: /* @__PURE__ */ jsxs(Layout, { children: [
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(InlineGrid, { columns: 4, gap: "400", children: [
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", tone: "subdued", children: "Total Views" }),
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingXl", children: totalViews })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", tone: "subdued", children: "Total Clicks" }),
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingXl", children: totalClicks })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", tone: "subdued", children: "Conversions" }),
        /* @__PURE__ */ jsx(Text, { as: "p", variant: "headingXl", children: totalConversions })
      ] }) }),
      /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", tone: "subdued", children: "Revenue" }),
        /* @__PURE__ */ jsxs(Text, { as: "p", variant: "headingXl", children: [
          "$",
          totalRevenue.toFixed(2)
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Bundle Performance" }),
      bundles.length === 0 ? /* @__PURE__ */ jsx(Text, { tone: "subdued", children: "No bundles created yet. Create your first bundle to start tracking performance!" }) : bundles.map((bundle) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: bundle.title }) }, bundle.id))
    ] }) }) })
  ] }) });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Analytics,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({ request }) => {
  return json({
    subscriptionStatus: "FREE"
  });
};
function Billing() {
  const { subscriptionStatus } = useLoaderData();
  const isPremium = subscriptionStatus === "ACTIVE";
  return /* @__PURE__ */ jsx(Page, { title: "Billing", backAction: { url: "/app" }, children: /* @__PURE__ */ jsxs(Layout, { children: [
    /* @__PURE__ */ jsx(Layout.Section, { children: isPremium ? /* @__PURE__ */ jsx(Banner, { tone: "success", children: /* @__PURE__ */ jsx("p", { children: "You're on the Premium plan! 🎉" }) }) : /* @__PURE__ */ jsx(Banner, { tone: "info", children: /* @__PURE__ */ jsx("p", { children: "You're on the Free plan" }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "500", children: [
      /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Free Plan (Current)" }),
        /* @__PURE__ */ jsxs(List, { children: [
          /* @__PURE__ */ jsx(List.Item, { children: "1 bundle maximum" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Basic analytics" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Standard support" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Premium Plan - $9.99/month" }),
        /* @__PURE__ */ jsxs(List, { children: [
          /* @__PURE__ */ jsx(List.Item, { children: "Unlimited bundles" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Advanced analytics" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Priority support" }),
          /* @__PURE__ */ jsx(List.Item, { children: "Custom discount rules" })
        ] })
      ] }),
      !isPremium && /* @__PURE__ */ jsx(
        Button,
        {
          variant: "primary",
          size: "large",
          onClick: () => alert("Billing integration coming soon!"),
          children: "Upgrade to Premium - $9.99/month"
        }
      )
    ] }) }) })
  ] }) });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Billing,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({ request }) => {
  return json({
    bundles: [],
    isFreePlan: true,
    bundleCount: 0
  });
};
function Bundles() {
  const { bundles, isFreePlan, bundleCount } = useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const canCreate = !isFreePlan || bundleCount < 1;
  const resourceName = {
    singular: "bundle",
    plural: "bundles"
  };
  const rowMarkup = bundles.map((bundle, index) => /* @__PURE__ */ jsxs(IndexTable.Row, { id: bundle.id, position: index, children: [
    /* @__PURE__ */ jsx(IndexTable.Cell, { children: bundle.title }),
    /* @__PURE__ */ jsx(IndexTable.Cell, { children: bundle.discountType === "PERCENTAGE" ? `${bundle.discountValue}%` : `$${bundle.discountValue}` }),
    /* @__PURE__ */ jsx(IndexTable.Cell, { children: /* @__PURE__ */ jsx(Badge, { tone: bundle.active ? "success" : "default", children: bundle.active ? "Active" : "Inactive" }) })
  ] }, bundle.id));
  return /* @__PURE__ */ jsx(
    Page,
    {
      title: "Manage Bundles",
      backAction: { url: "/app" },
      primaryAction: canCreate ? {
        content: showForm ? "Cancel" : "New Bundle",
        onAction: () => setShowForm(!showForm)
      } : void 0,
      children: /* @__PURE__ */ jsxs(Layout, { children: [
        !canCreate && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsxs(Banner, { tone: "warning", children: [
          "Free plan limit reached (1 bundle max).",
          " ",
          /* @__PURE__ */ jsx(Button, { url: "/app/billing", variant: "plain", children: "Upgrade to Premium" })
        ] }) }),
        showForm && /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
          /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Create New Bundle" }),
          /* @__PURE__ */ jsxs(FormLayout, { children: [
            /* @__PURE__ */ jsx(
              TextField,
              {
                label: "Bundle Title",
                value: title,
                onChange: setTitle,
                autoComplete: "off",
                placeholder: "e.g., Summer Bundle"
              }
            ),
            /* @__PURE__ */ jsx(
              Select,
              {
                label: "Discount Type",
                options: [
                  { label: "Percentage (%)", value: "PERCENTAGE" },
                  { label: "Fixed Amount ($)", value: "FIXED_AMOUNT" }
                ],
                value: discountType,
                onChange: setDiscountType
              }
            ),
            /* @__PURE__ */ jsx(
              TextField,
              {
                label: discountType === "PERCENTAGE" ? "Discount %" : "Discount $",
                value: discountValue,
                onChange: setDiscountValue,
                type: "number",
                autoComplete: "off"
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "primary",
                onClick: () => alert("Bundle creation coming soon with DB!"),
                children: "Save Bundle"
              }
            )
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { padding: "0", children: /* @__PURE__ */ jsx(
          IndexTable,
          {
            resourceName,
            itemCount: bundles.length,
            headings: [
              { title: "Title" },
              { title: "Discount" },
              { title: "Status" }
            ],
            selectable: false,
            emptyState: /* @__PURE__ */ jsx("div", { style: { padding: "2rem", textAlign: "center" }, children: /* @__PURE__ */ jsx(Text, { children: "No bundles yet. Create your first one!" }) }),
            children: rowMarkup
          }
        ) }) })
      ] })
    }
  );
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Bundles,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "demo-store.myshopify.com";
  return json({
    shop,
    bundleCount: 0,
    isFreePlan: true,
    canCreateMoreBundles: true
  });
};
function Index$1() {
  const { shop, bundleCount, isFreePlan, canCreateMoreBundles } = useLoaderData();
  return /* @__PURE__ */ jsx(Page, { title: "Smart Bundle Boost", children: /* @__PURE__ */ jsxs(Layout, { children: [
    /* @__PURE__ */ jsx(Layout.Section, { children: isFreePlan && /* @__PURE__ */ jsx(
      Banner,
      {
        title: "You're on the Free plan",
        action: {
          content: "Upgrade to Premium",
          url: "/app/billing"
        },
        tone: "info",
        children: /* @__PURE__ */ jsx("p", { children: "Create unlimited bundles for $9.99/month" })
      }
    ) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "400", children: [
      /* @__PURE__ */ jsx(Text, { as: "h2", variant: "headingMd", children: "Welcome to Smart Bundle Boost! 🎉" }),
      /* @__PURE__ */ jsx(Text, { children: "Increase your average order value by creating product bundles with automatic discounts." }),
      /* @__PURE__ */ jsxs(InlineStack, { gap: "300", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "primary",
            url: "/app/bundles",
            children: "Create Bundle"
          }
        ),
        /* @__PURE__ */ jsx(Button, { url: "/app/analytics", children: "View Analytics" })
      ] }),
      !canCreateMoreBundles && /* @__PURE__ */ jsx(Text, { tone: "critical", children: "Free plan limit reached. Upgrade to create more." })
    ] }) }) }),
    /* @__PURE__ */ jsx(Layout.Section, { children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(BlockStack, { gap: "200", children: [
      /* @__PURE__ */ jsx(Text, { as: "h3", variant: "headingSm", children: "Quick Stats" }),
      /* @__PURE__ */ jsxs(Text, { children: [
        "Active Bundles: ",
        bundleCount
      ] }),
      /* @__PURE__ */ jsxs(Text, { children: [
        "Plan: ",
        isFreePlan ? "Free" : "Premium"
      ] }),
      /* @__PURE__ */ jsxs(Text, { children: [
        "Shop: ",
        shop
      ] })
    ] }) }) })
  ] }) });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index$1,
  loader
}, Symbol.toStringTag, { value: "Module" }));
function Index() {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("title", { children: "Smart Bundle Boost" }),
      /* @__PURE__ */ jsx("meta", { httpEquiv: "refresh", content: "0; url=/app" })
    ] }),
    /* @__PURE__ */ jsx("body", { children: /* @__PURE__ */ jsx("p", { children: "Redirecting to app..." }) })
  ] });
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index
}, Symbol.toStringTag, { value: "Module" }));
function AppLayout() {
  return /* @__PURE__ */ jsx(AppProvider, { i18n: {}, children: /* @__PURE__ */ jsx(Outlet, {}) });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: AppLayout
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BH0j3zWa.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/components-B34O_SVR.js", "/assets/index-C_v_ZAYe.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CC8hra9U.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/components-B34O_SVR.js", "/assets/index-C_v_ZAYe.js"], "css": [] }, "routes/api.webhooks.gdpr.customers-data-request": { "id": "routes/api.webhooks.gdpr.customers-data-request", "parentId": "root", "path": "api/webhooks/gdpr/customers-data-request", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.webhooks.gdpr.customers-data-request-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.webhooks.app-subscription-update": { "id": "routes/api.webhooks.app-subscription-update", "parentId": "root", "path": "api/webhooks/app-subscription-update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.webhooks.app-subscription-update-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.webhooks.gdpr.customers-redact": { "id": "routes/api.webhooks.gdpr.customers-redact", "parentId": "root", "path": "api/webhooks/gdpr/customers-redact", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.webhooks.gdpr.customers-redact-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/api.webhooks.gdpr.shop-redact": { "id": "routes/api.webhooks.gdpr.shop-redact", "parentId": "root", "path": "api/webhooks/gdpr/shop-redact", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.webhooks.gdpr.shop-redact-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/app.analytics": { "id": "routes/app.analytics", "parentId": "routes/app", "path": "analytics", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.analytics-n5mtXlbS.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/context-CYUhCJnc.js", "/assets/components-B34O_SVR.js", "/assets/Page-VoUsC_71.js", "/assets/index-C_v_ZAYe.js"], "css": ["/assets/context-BeiPL2RV.css"] }, "routes/app.billing": { "id": "routes/app.billing", "parentId": "routes/app", "path": "billing", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.billing-BVZKuJUy.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/context-CYUhCJnc.js", "/assets/components-B34O_SVR.js", "/assets/Page-VoUsC_71.js", "/assets/Banner-DawR6ML9.js", "/assets/index-C_v_ZAYe.js"], "css": ["/assets/context-BeiPL2RV.css"] }, "routes/app.bundles": { "id": "routes/app.bundles", "parentId": "routes/app", "path": "bundles", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app.bundles-CsSisOjk.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/context-CYUhCJnc.js", "/assets/components-B34O_SVR.js", "/assets/Page-VoUsC_71.js", "/assets/Banner-DawR6ML9.js", "/assets/index-C_v_ZAYe.js"], "css": ["/assets/context-BeiPL2RV.css"] }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app._index-B6pcPj5O.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/context-CYUhCJnc.js", "/assets/components-B34O_SVR.js", "/assets/Page-VoUsC_71.js", "/assets/Banner-DawR6ML9.js", "/assets/index-C_v_ZAYe.js"], "css": ["/assets/context-BeiPL2RV.css"] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-DGshQGJO.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js"], "css": [] }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/app-mV18o1FV.js", "imports": ["/assets/jsx-runtime-BMrMXMSG.js", "/assets/context-CYUhCJnc.js", "/assets/index-C_v_ZAYe.js"], "css": ["/assets/context-BeiPL2RV.css"] } }, "url": "/assets/manifest-7586f29e.js", "version": "7586f29e" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/api.webhooks.gdpr.customers-data-request": {
    id: "routes/api.webhooks.gdpr.customers-data-request",
    parentId: "root",
    path: "api/webhooks/gdpr/customers-data-request",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/api.webhooks.app-subscription-update": {
    id: "routes/api.webhooks.app-subscription-update",
    parentId: "root",
    path: "api/webhooks/app-subscription-update",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/api.webhooks.gdpr.customers-redact": {
    id: "routes/api.webhooks.gdpr.customers-redact",
    parentId: "root",
    path: "api/webhooks/gdpr/customers-redact",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api.webhooks.gdpr.shop-redact": {
    id: "routes/api.webhooks.gdpr.shop-redact",
    parentId: "root",
    path: "api/webhooks/gdpr/shop-redact",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/app.analytics": {
    id: "routes/app.analytics",
    parentId: "routes/app",
    path: "analytics",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/app.billing": {
    id: "routes/app.billing",
    parentId: "routes/app",
    path: "billing",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/app.bundles": {
    id: "routes/app.bundles",
    parentId: "routes/app",
    path: "bundles",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route8
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route9
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
