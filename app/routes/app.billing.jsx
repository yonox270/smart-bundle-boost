import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Card, Button, BlockStack, Text, Banner } from "@shopify/polaris";
import { useEffect } from "react";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  return json({
    subscriptionStatus: shop?.subscriptionStatus || "FREE",
    planName: shop?.planName,
  });
};

export const action = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);

  const billingCheck = await billing.require({
    plans: ["Premium Plan"],
    isTest: true,
    onFailure: async () => billing.request({
      plan: "Premium Plan",
      isTest: true,
      amount: 9.99,
      currencyCode: "USD",
      interval: "EVERY_30_DAYS",
    }),
  });

  return json({
    confirmationUrl: billingCheck.confirmationUrl,
  });
};

export default function Billing() {
  const { subscriptionStatus, planName } = useLoaderData();
  const fetcher = useFetcher();
  const isPremium = subscriptionStatus === "ACTIVE";

  useEffect(() => {
    if (fetcher.data?.confirmationUrl) {
      window.open(fetcher.data.confirmationUrl, "_top");
    }
  }, [fetcher.data]);

  const handleUpgrade = () => {
    fetcher.submit({}, { method: "post" });
  };

  return (
    <Page title="Billing" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          {isPremium ? (
            <Banner tone="success">
              <p>You're on the Premium plan! 🎉</p>
            </Banner>
          ) : (
            <Banner tone="info">
              <p>You're on the Free plan</p>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Current Plan: {isPremium ? "Premium" : "Free"}
              </Text>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Free Plan
                </Text>
                <Text>✓ 1 bundle maximum</Text>
                <Text>✓ Basic analytics</Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Premium Plan - $9.99/month
                </Text>
                <Text>✓ Unlimited bundles</Text>
                <Text>✓ Advanced analytics</Text>
                <Text>✓ Priority support</Text>
              </BlockStack>

              {!isPremium && (
                <Button 
                  variant="primary" 
                  onClick={handleUpgrade} 
                  loading={fetcher.state === "submitting"}
                >
                  Upgrade to Premium
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}