import "@shopify/polaris/build/esm/styles.css";
import { Page, Layout, Card, Text, BlockStack, Banner } from "@shopify/polaris";

export default function Billing() {
  return (
    <Page title="Billing" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Banner tone="success">
            <p>🎉 You have full access to all features!</p>
          </Banner>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Your Plan</Text>
              <Text>✅ Unlimited bundles</Text>
              <Text>✅ Advanced analytics</Text>
              <Text>✅ Priority support</Text>
              <Text>Billing is managed directly by Shopify.</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}