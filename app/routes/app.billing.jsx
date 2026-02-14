import "@shopify/polaris/build/esm/styles.css";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Banner,
  List,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "bundle-test-20220534.myshopify.com";

  const shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  return json({
    shop,
    subscriptionStatus: shopData?.subscriptionStatus || "FREE",
  });
};

export const action = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const billingCheck = await billing.require({
      plans: ["Premium Plan"],
      isTest: false,
      onFailure: async () =>
        billing.request({
          plan: "Premium Plan",
          isTest: false,
          amount: 9.99,
          currencyCode: "USD",
          interval: "EVERY_30_DAYS",
          trialDays: 7,
        }),
    });

    await prisma.shop.upsert({
      where: { shopDomain: shop },
      update: { subscriptionStatus: "ACTIVE", planName: "Premium Plan" },
      create: {
        shopDomain: shop,
        accessToken: session.accessToken || "",
        scope: "",
        subscriptionStatus: "ACTIVE",
        planName: "Premium Plan",
      },
    });

    return redirect(`/app?shop=${shop}`);
  } catch (error) {
    console.error("Billing error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function Billing() {
  const { shop, subscriptionStatus } = useLoaderData();
  const isPremium = subscriptionStatus === "ACTIVE";

  return (
    <Page title="Billing" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          {isPremium ? (
            <Banner tone="success">
              <p>🎉 You're on the Premium plan! Enjoy unlimited bundles.</p>
            </Banner>
          ) : (
            <Banner tone="info">
              <p>You're on the Free plan. Upgrade to unlock all features!</p>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="300">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text as="h2" variant="headingMd">Free Plan</Text>
                  {!isPremium && <Badge tone="success">Current</Badge>}
                </div>
                <List>
                  <List.Item>1 bundle maximum</List.Item>
                  <List.Item>Basic analytics</List.Item>
                  <List.Item>Standard support</List.Item>
                </List>
                <Text variant="headingLg">$0/month</Text>
              </BlockStack>

              <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: "1.25rem" }}>
                <BlockStack gap="300">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="h2" variant="headingMd">Premium Plan</Text>
                    {isPremium && <Badge tone="success">Current</Badge>}
                  </div>
                  <List>
                    <List.Item>✅ Unlimited bundles</List.Item>
                    <List.Item>✅ Advanced analytics</List.Item>
                    <List.Item>✅ Priority support</List.Item>
                    <List.Item>✅ Custom discount rules</List.Item>
                    <List.Item>✅ 7-day free trial</List.Item>
                  </List>
                  <Text variant="headingLg">$9.99/month</Text>

                  {!isPremium && (
                    <form
                      method="POST"
                      action={`https://smart-bundle-boost-eight.vercel.app/app/billing?shop=${shop}`}
                    >
                      <input type="hidden" name="shop" value={shop} />
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#008060",
                          color: "white",
                          border: "none",
                          padding: "12px 24px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "16px",
                          fontWeight: "600",
                          width: "100%",
                        }}
                      >
                        Start 7-Day Free Trial
                      </button>
                    </form>
                  )}
                </BlockStack>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}