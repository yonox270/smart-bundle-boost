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
  InlineStack,
} from "@shopify/polaris";
import prisma from "~/db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "bundle-test-20220534.myshopify.com";

  const shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    include: { bundles: { where: { active: true } } },
  });

  return json({
    shop,
    bundleCount: shopData?.bundles?.length || 0,
  });
};

export default function Index() {
  const { shop, bundleCount } = useLoaderData();

  return (
    <Page title="Smart Bundle Boost">
      <Layout>
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
                <Button variant="primary" url={`/app/bundles?shop=${shop}`}>
                  Manage Bundles
                </Button>
                <Button url={`/app/analytics?shop=${shop}`}>
                  View Analytics
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">Quick Stats</Text>
              <Text>Active Bundles: {bundleCount}</Text>
              <Text>Shop: {shop}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}