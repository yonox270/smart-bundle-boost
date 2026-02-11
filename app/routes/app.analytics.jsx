import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, BlockStack } from "@shopify/polaris";

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
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Overall Performance
              </Text>
              <BlockStack gap="200">
                <Text>Total Views: {totalViews}</Text>
                <Text>Total Clicks: {totalClicks}</Text>
                <Text>Total Conversions: {totalConversions}</Text>
                <Text>Total Revenue: ${totalRevenue.toFixed(2)}</Text>
                <Text>Conversion Rate: 0%</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Bundle Performance
              </Text>
              <Text>No bundles created yet. Create your first bundle to start tracking performance!</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}