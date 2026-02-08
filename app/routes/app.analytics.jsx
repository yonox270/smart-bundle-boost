import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: {
      bundles: {
        include: {
          analytics: true,
        },
      },
    },
  });

  let totalViews = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  shop?.bundles.forEach((bundle) => {
    bundle.analytics.forEach((analytic) => {
      totalViews += analytic.views;
      totalClicks += analytic.clicks;
      totalConversions += analytic.conversions;
      totalRevenue += analytic.revenue;
    });
  });

  return json({
    totalViews,
    totalClicks,
    totalConversions,
    totalRevenue,
    bundles: shop?.bundles || [],
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
                <Text>
                  Conversion Rate:{" "}
                  {totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0}%
                </Text>
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
              {bundles.length === 0 ? (
                <Text>No bundles created yet. Create your first bundle to start tracking performance!</Text>
              ) : (
                bundles.map((bundle) => {
                  const bundleViews = bundle.analytics.reduce((sum, a) => sum + a.views, 0);
                  const bundleClicks = bundle.analytics.reduce((sum, a) => sum + a.clicks, 0);
                  const bundleConversions = bundle.analytics.reduce((sum, a) => sum + a.conversions, 0);
                  const bundleRevenue = bundle.analytics.reduce((sum, a) => sum + a.revenue, 0);

                  return (
                    <Card key={bundle.id}>
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm">
                          {bundle.title}
                        </Text>
                        <Text>Views: {bundleViews}</Text>
                        <Text>Clicks: {bundleClicks}</Text>
                        <Text>Conversions: {bundleConversions}</Text>
                        <Text>Revenue: ${bundleRevenue.toFixed(2)}</Text>
                      </BlockStack>
                    </Card>
                  );
                })
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}