import "@shopify/polaris/build/esm/styles.css";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Badge,
  Banner,
  IndexTable,
  Select,
  TextField,
  FormLayout,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import prisma from "~/db.server";

const getShop = (request, formData = null) => {
  if (formData) {
    const s = formData.get("shop");
    if (s && s !== "demo-store.myshopify.com") return s;
  }
  const url = new URL(request.url);
  const s = url.searchParams.get("shop");
  if (s) return s;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/shop=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return "demo-store.myshopify.com";
};

export const loader = async ({ request }) => {
  const shop = getShop(request);

  let shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    include: { bundles: { orderBy: { createdAt: "desc" } } },
  });

  if (!shopData) {
    shopData = await prisma.shop.create({
      data: { shopDomain: shop, accessToken: "", scope: "" },
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
  const formData = await request.formData();
  const actionType = formData.get("action");
  const shop = getShop(request, formData);

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
      return json({ error: "Free plan limit reached" });
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
    return json({ success: true, action: "created" });
  }

  if (actionType === "delete") {
    const bundleId = formData.get("bundleId");
    await prisma.bundle.delete({ where: { id: bundleId } });
    return json({ success: true, action: "deleted" });
  }

  if (actionType === "toggle") {
    const bundleId = formData.get("bundleId");
    const currentActive = formData.get("currentActive") === "true";
    await prisma.bundle.update({
      where: { id: bundleId },
      data: { active: !currentActive },
    });
    return json({ success: true, action: "toggled" });
  }

  return json({ success: true });
};

export default function Bundles() {
  const { bundles: initialBundles, isFreePlan, bundleCount, shop } = useLoaderData();
  const fetcher = useFetcher();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [bundles, setBundles] = useState(initialBundles);

  // Recharge les bundles après chaque action
  useEffect(() => {
    if (fetcher.data?.success) {
      setShowForm(false);
      setTitle("");
      setDiscountValue("10");
      // Recharge la page pour voir les nouveaux bundles
      window.location.reload();
    }
  }, [fetcher.data]);

  const canCreate = !isFreePlan || bundleCount < 1;

  const handleCreate = () => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("shop", shop);
    formData.append("title", title);
    formData.append("discountType", discountType);
    formData.append("discountValue", discountValue);
    fetcher.submit(formData, { method: "post" });
  };

  const handleDelete = (bundleId) => {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("shop", shop);
    formData.append("bundleId", bundleId);
    fetcher.submit(formData, { method: "post" });
  };

  const handleToggle = (bundleId, currentActive) => {
    const formData = new FormData();
    formData.append("action", "toggle");
    formData.append("shop", shop);
    formData.append("bundleId", bundleId);
    formData.append("currentActive", String(currentActive));
    fetcher.submit(formData, { method: "post" });
  };

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
        <button
          onClick={() => handleToggle(bundle.id, bundle.active)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#2c6ecb", fontSize: "14px" }}
        >
          {bundle.active ? "Deactivate" : "Activate"}
        </button>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <button
          onClick={() => handleDelete(bundle.id)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#d72c0d", fontSize: "14px" }}
        >
          Delete
        </button>
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
              <a href="/app/billing" style={{ color: "#2c6ecb" }}>
                Upgrade to Premium
              </a>
            </Banner>
          </Layout.Section>
        )}

        {showForm && canCreate && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Create New Bundle</Text>
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
                    label={discountType === "PERCENTAGE" ? "Discount %" : "Discount Amount $"}
                    value={discountValue}
                    onChange={setDiscountValue}
                    type="number"
                    autoComplete="off"
                    min="0"
                    max={discountType === "PERCENTAGE" ? "100" : undefined}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={fetcher.state === "submitting"}
                    style={{
                      backgroundColor: fetcher.state === "submitting" ? "#ccc" : "#008060",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: fetcher.state === "submitting" ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {fetcher.state === "submitting" ? "Saving..." : "Save Bundle"}
                  </button>
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