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
  Select,
  TextField,
  FormLayout,
} from "@shopify/polaris";
import { useState } from "react";
import prisma from "~/db.server";

const API_URL = "https://smart-bundle-boost-eight.vercel.app/api/bundles";

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

export default function Bundles() {
  const { bundles, isFreePlan, bundleCount, shop } = useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10");
  const [loading, setLoading] = useState(false);
  const [localBundles, setLocalBundles] = useState(bundles);

  const canCreate = !isFreePlan || bundleCount < 1;

  const handleCreate = async () => {
    if (!title) {
      alert("Titre vide !");
      return;
    }
    setLoading(true);
    alert("Envoi vers: " + API_URL + " | shop: " + shop);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({
          action: "create",
          shop: shop,
          title: title,
          discountType: discountType,
          discountValue: discountValue,
        }),
      });
      alert("Status reçu: " + response.status);
      const data = await response.json();
      alert("Réponse: " + JSON.stringify(data));
      if (data.success) {
        setShowForm(false);
        setTitle("");
        setDiscountValue("10");
        window.location.reload();
      }
    } catch (e) {
      alert("ERREUR CATCH: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bundleId) => {
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({
          action: "delete",
          shop: shop,
          bundleId: bundleId,
        }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (bundleId, currentActive) => {
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({
          action: "toggle",
          shop: shop,
          bundleId: bundleId,
          currentActive: String(currentActive),
        }),
      });
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resourceName = { singular: "bundle", plural: "bundles" };

  const rowMarkup = localBundles.map((bundle, index) => (
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
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#2c6ecb",
            fontSize: "14px",
          }}
        >
          {bundle.active ? "Deactivate" : "Activate"}
        </button>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <button
          onClick={() => handleDelete(bundle.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#d72c0d",
            fontSize: "14px",
          }}
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
                    label={
                      discountType === "PERCENTAGE"
                        ? "Discount %"
                        : "Discount Amount $"
                    }
                    value={discountValue}
                    onChange={setDiscountValue}
                    type="number"
                    autoComplete="off"
                    min="0"
                    max={discountType === "PERCENTAGE" ? "100" : undefined}
                  />
                  <button
                    onClick={handleCreate}
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
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={localBundles.length}
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