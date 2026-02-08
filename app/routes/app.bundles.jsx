import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  BlockStack,
  IndexTable,
  Badge,
  Text,
  Banner,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: { bundles: { orderBy: { createdAt: "desc" } } },
  });

  const response = await admin.rest.resources.Product.all({
    session: session,
    limit: 50,
  });

  const products = response.data.map((p) => ({
    label: p.title,
    value: String(p.id),
  }));

  return json({
    bundles: shop?.bundles || [],
    products,
    isFreePlan: shop?.subscriptionStatus === "FREE" || !shop?.subscriptionStatus,
    bundleCount: shop?.bundles?.length || 0,
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("action");

  const shop = await prisma.shop.findUnique({
    where: { shopDomain: session.shop },
    include: { bundles: true },
  });

  if (actionType === "create") {
    if ((shop?.subscriptionStatus === "FREE" || !shop?.subscriptionStatus) && shop.bundles.length >= 1) {
      return json({ error: "Free plan limit reached" }, { status: 400 });
    }

    const title = formData.get("title");
    const discountType = formData.get("discountType");
    const discountValue = parseFloat(formData.get("discountValue"));
    const productIds = formData.getAll("productIds");

    await prisma.bundle.create({
      data: {
        shopId: shop.id,
        title,
        discountType,
        discountValue,
        productIds,
      },
    });

    return redirect("/app/bundles");
  }

  if (actionType === "delete") {
    const bundleId = formData.get("bundleId");
    await prisma.bundle.delete({ where: { id: bundleId } });
    return redirect("/app/bundles");
  }

  return json({ success: true });
};

export default function Bundles() {
  const { bundles, products, isFreePlan, bundleCount } = useLoaderData();
  const [showForm, setShowForm] = useState(false);

  const [formState, setFormState] = useState({
    title: "",
    discountType: "PERCENTAGE",
    discountValue: "10",
    productIds: [],
  });

  const canCreate = !isFreePlan || bundleCount < 1;

  const resourceName = {
    singular: "bundle",
    plural: "bundles",
  };

  const rowMarkup = bundles.map((bundle, index) => (
    <IndexTable.Row id={bundle.id} key={bundle.id} position={index}>
      <IndexTable.Cell>{bundle.title}</IndexTable.Cell>
      <IndexTable.Cell>
        {bundle.discountType === "PERCENTAGE" ? `${bundle.discountValue}%` : `$${bundle.discountValue}`}
      </IndexTable.Cell>
      <IndexTable.Cell>{bundle.productIds.length} products</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={bundle.active ? "success" : "default"}>
          {bundle.active ? "Active" : "Inactive"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Form method="post">
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="bundleId" value={bundle.id} />
          <Button submit variant="plain" tone="critical">
            Delete
          </Button>
        </Form>
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
              content: "Create Bundle",
              onAction: () => setShowForm(!showForm),
            }
          : undefined
      }
    >
      <Layout>
        {!canCreate && (
          <Layout.Section>
            <Banner tone="warning">
              Free plan limit reached. Upgrade to Premium to create unlimited bundles.
            </Banner>
          </Layout.Section>
        )}

        {showForm && canCreate && (
          <Layout.Section>
            <Card>
              <Form method="post">
                <FormLayout>
                  <TextField
                    label="Bundle Title"
                    name="title"
                    value={formState.title}
                    onChange={(value) => setFormState({ ...formState, title: value })}
                    autoComplete="off"
                    placeholder="e.g., Summer Bundle"
                  />

                  <Select
                    label="Discount Type"
                    name="discountType"
                    options={[
                      { label: "Percentage", value: "PERCENTAGE" },
                      { label: "Fixed Amount", value: "FIXED_AMOUNT" },
                    ]}
                    value={formState.discountType}
                    onChange={(value) => setFormState({ ...formState, discountType: value })}
                  />

                  <TextField
                    label="Discount Value"
                    name="discountValue"
                    type="number"
                    value={formState.discountValue}
                    onChange={(value) => setFormState({ ...formState, discountValue: value })}
                    autoComplete="off"
                    helpText={formState.discountType === "PERCENTAGE" ? "Enter percentage (e.g., 10 for 10%)" : "Enter amount (e.g., 5 for $5 off)"}
                  />

                  <div>
                    <Text as="p" variant="bodyMd">Select Products (hold Ctrl/Cmd for multiple)</Text>
                    <select
                      name="productIds"
                      multiple
                      style={{ 
                        width: "100%", 
                        height: "150px", 
                        padding: "8px",
                        marginTop: "8px",
                        border: "1px solid #c4cdd5",
                        borderRadius: "4px"
                      }}
                      value={formState.productIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormState({ ...formState, productIds: selected });
                      }}
                    >
                      {products.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <input type="hidden" name="action" value="create" />

                  <Button submit variant="primary">
                    Create Bundle
                  </Button>
                </FormLayout>
              </Form>
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
                { title: "Products" },
                { title: "Status" },
                { title: "Actions" },
              ]}
              selectable={false}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}