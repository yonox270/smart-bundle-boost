import "@shopify/polaris/build/esm/styles.css";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
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
import prisma from "~/db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "demo-store.myshopify.com";

  let shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    include: { bundles: { orderBy: { createdAt: "desc" } } },
  });

  if (!shopData) {
    shopData = await prisma.shop.create({
      data: {
        shopDomain: shop,
        accessToken: "",
        scope: "",
      },
      include: { bundles: true },
    });
  }

  return json({
    bundles: shopData?.bundles || [],
    isFreePlan: shopData?.subscriptionStatus === "FREE" || !shopData?.subscriptionStatus,
    bundleCount: shopData?.bundles?.length || 0,
    shop,
  });
};

export const action = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "demo-store.myshopify.com";
  const formData = await request.formData();
  const actionType = formData.get("action");

  let shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    include: { bundles: true },
  });

  if (!shopData) {
    shopData = await prisma.shop.create({
      data: { shopDomain: shop, accessToken: "", scope: "" },
      include: { bundles: true },
    });
  }

  if (actionType === "create") {
    const isFreePlan = shopData?.subscriptionStatus === "FREE" || !shopData?.subscriptionStatus;
    if (isFreePlan && shopData.bundles.length >= 1) {
      return json({ error: "Free plan limit reached" }, { status: 400 });
    }

    const title = formData.get("title");
    const discountType = formData.get("discountType");
    const discountValue = parseFloat(formData.get("discountValue"));

    await prisma.bundle.create({
      data: {
        shopId: shopData.id,
        title,
        discountType,
        discountValue,
        productIds: [],
      },
    });

    return redirect(`/app/bundles?shop=${shop}`);
  }

  if (actionType === "delete") {
    const bundleId = formData.get("bundleId");
    await prisma.bundle.delete({ where: { id: bundleId } });
    return redirect(`/app/bundles?shop=${shop}`);
  }

  if (actionType === "toggle") {
    const bundleId = formData.get("bundleId");
    const currentActive = formData.get("currentActive") === "true";
    await prisma.bundle.update({
      where: { id: bundleId },
      data: { active: !currentActive },
    });
    return redirect(`/app/bundles?shop=${shop}`);
  }

  return json({ success: true });
};

export default function Bundles() {
  const { bundles, isFreePlan, bundleCount, shop } = useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");

  const canCreate = !isFreePlan || bundleCount < 1;

  const resourceName = { singular: "bundle", plural: "bundles" };

  const rowMarkup = bundles.map((bundle, index) => (
    <IndexTable.Row id={bundle.id} key={bundle.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold">{bundle.title}</Text>
      </IndexTable.Cell>
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
      <IndexTable.Cell>
        <Form method="post" action={`/app/bundles?shop=${shop}`}>
          <input type="hidden" name="action" value="toggle" />
          <input type="hidden" name="bundleId" value={bundle.id} />
          <input type="hidden" name="currentActive" value={String(bundle.active)} />
          <Button submit variant="plain">
            {bundle.active ? "Deactivate" : "Activate"}
          </Button>
        </Form>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Form method="post" action={`/app/bundles?shop=${shop}`}>
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="bundleId" value={bundle.id} />
          <Button submit variant="plain" tone="critical">Delete</Button>
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
              content: showForm ? "Cancel" : "New Bundle",
              onAction: () => {
                setShowForm(!showForm);
                setTitle("");
                setDiscountValue("10");
              },
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

        {showForm && canCreate && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Create New Bundle</Text>
                <Form method="post" action={`/app/bundles?shop=${shop}`}>
                  <input type="hidden" name="action" value="create" />
                  <FormLayout>
                    <TextField
                      label="Bundle Title"
                      name="title"
                      value={title}
                      onChange={setTitle}
                      autoComplete="off"
                      placeholder="e.g., Summer Bundle"
                    />
                    <Select
                      label="Discount Type"
                      name="discountType"
                      options={[
                        { label: "Percentage (%)", value: "PERCENTAGE" },
                        { label: "Fixed Amount ($)", value: "FIXED_AMOUNT" },
                      ]}
                      value={discountType}
                      onChange={setDiscountType}
                    />
                    <TextField
                      label={discountType === "PERCENTAGE" ? "Discount %" : "Discount Amount $"}
                      name="discountValue"
                      value={discountValue}
                      onChange={setDiscountValue}
                      type="number"
                      autoComplete="off"
                      min="0"
                      max={discountType === "PERCENTAGE" ? "100" : undefined}
                    />
                    <Button submit variant="primary">
                      Save Bundle
                    </Button>
                  </FormLayout>
                </Form>
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
                { title: "Toggle" },
                { title: "Delete" },
              ]}
              selectable={false}
              emptyState={
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  <Text tone="subdued">
                    No bundles yet. Click "New Bundle" to create your first one!
                  </Text>
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