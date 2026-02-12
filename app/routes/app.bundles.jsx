import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Button,
  TextField,
  Select,
  FormLayout,
  IndexTable,
  Badge,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";

export const loader = async ({ request }) => {
  return json({
    bundles: [],
    isFreePlan: true,
    bundleCount: 0,
  });
};

export default function Bundles() {
  const { bundles, isFreePlan, bundleCount } = useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");

  const canCreate = !isFreePlan || bundleCount < 1;

  const resourceName = {
    singular: "bundle",
    plural: "bundles",
  };

  const rowMarkup = bundles.map((bundle, index) => (
    <IndexTable.Row id={bundle.id} key={bundle.id} position={index}>
      <IndexTable.Cell>{bundle.title}</IndexTable.Cell>
      <IndexTable.Cell>
        {bundle.discountType === "PERCENTAGE"
          ? `${bundle.discountValue}%`
          : `$${bundle.discountValue}`}
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={bundle.active ? "success" : "default"}>
          {bundle.active ? "Active" : "Inactive"}
        </Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Manage Bundles"
      backAction={{ url: "/app" }}
      primaryAction={
        canCreate
          ? {
              content: showForm ? "Cancel" : "New Bundle",
              onAction: () => setShowForm(!showForm),
            }
          : undefined
      }
    >
      <Layout>
        {!canCreate && (
          <Layout.Section>
            <Banner tone="warning">
              Free plan limit reached (1 bundle max).{" "}
              <Button url="/app/billing" variant="plain">
                Upgrade to Premium
              </Button>
            </Banner>
          </Layout.Section>
        )}

        {showForm && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Create New Bundle
                </Text>
                <FormLayout>
                  <TextField
                    label="Bundle Title"
                    value={title}
                    onChange={setTitle}
                    autoComplete="off"
                    placeholder="e.g., Summer Bundle"
                  />
                  <Select
                    label="Discount Type"
                    options={[
                      { label: "Percentage (%)", value: "PERCENTAGE" },
                      { label: "Fixed Amount ($)", value: "FIXED_AMOUNT" },
                    ]}
                    value={discountType}
                    onChange={setDiscountType}
                  />
                  <TextField
                    label={discountType === "PERCENTAGE" ? "Discount %" : "Discount $"}
                    value={discountValue}
                    onChange={setDiscountValue}
                    type="number"
                    autoComplete="off"
                  />
                  <Button
                    variant="primary"
                    onClick={() => alert("Bundle creation coming soon with DB!")}
                  >
                    Save Bundle
                  </Button>
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={bundles.length}
              headings={[
                { title: "Title" },
                { title: "Discount" },
                { title: "Status" },
              ]}
              selectable={false}
              emptyState={
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <Text>No bundles yet. Create your first one!</Text>
                </div>
              }
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}