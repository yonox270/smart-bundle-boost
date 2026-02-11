import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  return json({
    bundles: [],
    products: [],
    isFreePlan: true,
    bundleCount: 0,
  });
};

export default function Bundles() {
  const { bundles, bundleCount } = useLoaderData();

  return (
    <Page
      title="Manage Bundles"
      backAction={{ url: "/app" }}
      primaryAction={{
        content: "Create Bundle",
        onAction: () => alert("Feature coming soon!"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Your Bundles ({bundleCount})
            </Text>
            <Text>No bundles yet. Create your first one!</Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}