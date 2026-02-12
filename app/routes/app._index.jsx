import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
  Banner,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  // SANS authenticate pour l'instant
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "demo-store.myshopify.com";

  return json({
    shop: shop,
    bundleCount: 0,
    isFreePlan: true,
    canCreateMoreBundles: true,
    subscriptionStatus: "FREE",
  });
};

export default function Index() {
  const { shop, bundleCount, isFreePlan, canCreateMoreBundles } = useLoaderData();
  const navigate = useNavigate();

  return (
    <Page title="Smart Bundle Boost">
      <Layout>
        <Layout.Section>
          {isFreePlan && (
            <Banner
              title="You're on the Free plan"
              action={{ content: "Upgrade to Premium", onAction: () => navigate("/app/billing") }}
              tone="info"
            >
              <p>Create unlimited bundles for $9.99/month</p>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Welcome to Smart Bundle Boost! 🎉
              </Text>
              <Text>
                Increase your average order value by creating product bundles with automatic discounts.
              </Text>
              <InlineStack gap="300">
                <Button
                  variant="primary"
                  onClick={() => navigate("/app/bundles")}
                  disabled={!canCreateMoreBundles}
                >
                  Create Bundle
                </Button>
                <Button onClick={() => navigate("/app/analytics")}>
                  View Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                Quick Stats
              </Text>
              <Text>Active Bundles: {bundleCount}</Text>
              <Text>Plan: {isFreePlan ? "Free" : "Premium"}</Text>
              <Text>Shop: {shop}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}