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
  DataTable,
} from "@shopify/polaris";
import prisma from "~/db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "demo-store.myshopify.com";

  const shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
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

  const bundleStats = shopData?.bundles.map((bundle) => {
    const views = bundle.analytics.reduce((s, a) => s + a.views, 0);
    const clicks = bundle.analytics.reduce((s, a) => s + a.clicks, 0);
    const conversions = bundle.analytics.reduce((s, a) => s + a.conversions, 0);
    const revenue = bundle.analytics.reduce((s, a) => s + a.revenue, 0);
    const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(1) : "0.0";

    totalViews += views;
    totalClicks += clicks;
    totalConversions += conversions;
    totalRevenue += revenue;

    return {
      id: bundle.id,
      title: bundle.title,
      active: bundle.active,
      views,
      clicks,
      conversions,
      revenue,
      conversionRate,
    };
  }) || [];

  return json({
    totalViews,
    totalClicks,
    totalConversions,
    totalRevenue,
    bundleStats,
  });
};

export default function Analytics() {
  const { totalViews, totalClicks, totalConversions, totalRevenue, bundleStats } = useLoaderData();

  const rows = bundleStats.map((bundle) => [
    bundle.title,
    bundle.active ? "✅ Active" : "⏸ Inactive",
    bundle.views.toString(),
    bundle.clicks.toString(),
    bundle.conversions.toString(),
    `${bundle.conversionRate}%`,
    `$${bundle.revenue.toFixed(2)}`,
  ]);

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
              {bundleStats.length === 0 ? (
                <Text tone="subdued">
                  No bundles yet. Create your first bundle to start tracking performance!
                </Text>
              ) : (
                <DataTable
                  columnContentTypes={[
                    "text",
                    "text",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                    "numeric",
                  ]}
                  headings={[
                    "Bundle",
                    "Status",
                    "Views",
                    "Clicks",
                    "Conversions",
                    "Conv. Rate",
                    "Revenue",
                  ]}
                  rows={rows}
                  footerContent={`${bundleStats.length} bundle${bundleStats.length > 1 ? "s" : ""} total`}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}