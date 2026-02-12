import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Text,
  Banner,
  List,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  return json({
    subscriptionStatus: "FREE",
  });
};

export default function Billing() {
  const { subscriptionStatus } = useLoaderData();
  const isPremium = subscriptionStatus === "ACTIVE";

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
            <BlockStack gap="500">
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Free Plan (Current)
                </Text>
                <List>
                  <List.Item>1 bundle maximum</List.Item>
                  <List.Item>Basic analytics</List.Item>
                  <List.Item>Standard support</List.Item>
                </List>
              </BlockStack>

              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Premium Plan - $9.99/month
                </Text>
                <List>
                  <List.Item>Unlimited bundles</List.Item>
                  <List.Item>Advanced analytics</List.Item>
                  <List.Item>Priority support</List.Item>
                  <List.Item>Custom discount rules</List.Item>
                </List>
              </BlockStack>

              {!isPremium && (
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => alert("Billing integration coming soon!")}
                >
                  Upgrade to Premium - $9.99/month
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}