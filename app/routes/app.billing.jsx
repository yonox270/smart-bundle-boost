import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Button, BlockStack, Text, Banner } from "@shopify/polaris";

export const loader = async ({ request }) => {
  return json({
    subscriptionStatus: "FREE",
    planName: null,
  });
};

export default function Billing() {
  const { subscriptionStatus } = useLoaderData();
  const isPremium = subscriptionStatus === "ACTIVE";

  return (
    <Page title="Billing" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Banner tone="info">
            <p>You're on the Free plan</p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Current Plan: Free
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

              <Button variant="primary" onClick={() => alert("Billing coming soon!")}>
                Upgrade to Premium
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}