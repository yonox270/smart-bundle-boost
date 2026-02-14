import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Badge,
  Banner,
  IndexTable,
} from "@shopify/polaris";
import { useState } from "react";
import prisma from "~/db.server";

const getShop = (request) => {
  const url = new URL(request.url);
  const s = url.searchParams.get("shop");
  if (s) return s;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/shop=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return "bundle-test-20220534.myshopify.com";
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
  const shop = formData.get("shop") || "bundle-test-20220534.myshopify.com";

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
  }

  if (actionType === "delete") {
    await prisma.bundle.delete({ where: { id: formData.get("bundleId") } });
  }

  if (actionType === "toggle") {
    const currentActive = formData.get("currentActive") === "true";
    await prisma.bundle.update({
      where: { id: formData.get("bundleId") },
      data: { active: !currentActive },
    });
  }

  // Recharge les bundles
  const updated = await prisma.shop.findUnique({
    where: { shopDomain: shop },
    include: { bundles: { orderBy: { createdAt: "desc" } } },
  });

  return json({
    bundles: updated?.bundles || [],
    isFreePlan: updated?.subscriptionStatus === "FREE" || !updated?.subscriptionStatus,
    bundleCount: updated?.bundles?.length || 0,
    shop,
    success: true,
  });
};

export default function Bundles() {
  const loaderData = useLoaderData();
  const [data, setData] = useState(loaderData);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { bundles, isFreePlan, bundleCount, shop } = data;
  const canCreate = !isFreePlan || bundleCount < 1;

  const submitAction = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch(window.location.href, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setData(result);
        setShowForm(false);
      }
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    formData.append("action", "create");
    formData.append("shop", shop);
    await submitAction(formData);
    form.reset();
  };

  const handleDelete = async (bundleId) => {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("shop", shop);
    formData.append("bundleId", bundleId);
    await submitAction(formData);
  };

  const handleToggle = async (bundleId, currentActive) => {
    const formData = new FormData();
    formData.append("action", "toggle");
    formData.append("shop", shop);
    formData.append("bundleId", bundleId);
    formData.append("currentActive", String(currentActive));
    await submitAction(formData);
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
          ? { content: showForm ? "Cancel" : "New Bundle", onAction: () => setShowForm(!showForm) }
          : undefined
      }
    >
      <Layout>
        {!canCreate && (
          <Layout.Section>
            <Banner tone="warning">
              Free plan limit reached (1 bundle max).{" "}
              <a href="/app/billing" style={{ color: "#2c6ecb" }}>Upgrade to Premium</a>
            </Banner>
          </Layout.Section>
        )}

        {showForm && canCreate && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Create New Bundle</Text>
                <form onSubmit={handleCreate}>
                  <BlockStack gap="300">
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                        Bundle Title
                      </label>
                      <input
                        name="title"
                        type="text"
                        required
                        placeholder="e.g., Summer Bundle"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                        Discount Type
                      </label>
                      <select
                        name="discountType"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
                        Discount Value
                      </label>
                      <input
                        name="discountValue"
                        type="number"
                        defaultValue="10"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? "#ccc" : "#008060",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      {loading ? "Saving..." : "Save Bundle"}
                    </button>
                  </BlockStack>
                </form>
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
                  <Text tone="subdued">No bundles yet. Click "New Bundle" to create your first one!</Text>
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