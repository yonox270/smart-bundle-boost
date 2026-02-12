import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  return json({
    totalViews: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalRevenue: 0,
    bundles: [],
  });
};

export default function Analytics() {
  const { totalViews, totalClicks, totalConversions, totalRevenue, bundles } = useLoaderData();

  return (
    <Page title="Analytics" backAction={{ url: "/app" }}>
      <Layout>
        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Total Views
                </Text>
                <Text as="p" variant="headingXl">
                  {totalViews}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Total Clicks
                </Text>
                <Text as="p" variant="headingXl">
                  {totalClicks}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Conversions
                </Text>
                <Text as="p" variant="headingXl">
                  {totalConversions}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Revenue
                </Text>
                <Text as="p" variant="headingXl">
                  ${totalRevenue.toFixed(2)}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Bundle Performance
              </Text>
              {bundles.length === 0 ? (
                <Text tone="subdued">
                  No bundles created yet. Create your first bundle to start tracking performance!
                </Text>
              ) : (
                bundles.map((bundle) => (
                  <Card key={bundle.id}>
                    <Text as="h3" variant="headingSm">
                      {bundle.title}
                    </Text>
                  </Card>
                ))
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}