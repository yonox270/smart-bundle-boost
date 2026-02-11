import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  // Version simple sans DB
  return json({
    shop: "test-shop.myshopify.com",
    bundleCount: 0,
    isFreePlan: true,
  });
};

export default function Index() {
  const { shop, bundleCount, isFreePlan } = useLoaderData();

  return (
    <Page title="Smart Bundle Boost">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                ✅ L'app fonctionne ! 🎉
              </Text>
              <Text>
                Shop: {shop}
              </Text>
              <Text>
                Bundles: {bundleCount}
              </Text>
              <Text>
                Plan: {isFreePlan ? "Free" : "Premium"}
              </Text>
              <Button variant="primary">
                Test Button
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}