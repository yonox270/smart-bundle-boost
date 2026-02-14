import "@shopify/polaris/build/esm/styles.css";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Badge,
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
    bundleCount: shopData?.bundles?.length || 0,
    shop,
  });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("action");
  const shop = formData.get("shop") || getShop(request);

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

    // Récupère le token depuis la table Session
    const session = await prisma.session.findFirst({
      where: { shop: shop },
    });

    console.log("Session found:", session ? "yes" : "no");
    console.log("Access token:", session?.accessToken ? "present" : "missing");

    if (session?.accessToken) {
      try {
        const discountAmount = discountType === "PERCENTAGE"
          ? { percentage: discountValue / 100 }
          : { amount: { amount: String(discountValue), currencyCode: "USD" } };

        const mutation = `
          mutation CreateDiscount($input: DiscountAutomaticBasicInput!) {
            discountAutomaticBasicCreate(automaticBasicDiscount: $input) {
              automaticDiscountNode {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const variables = {
          input: {
            title: `Bundle: ${title}`,
            startsAt: new Date().toISOString(),
            minimumRequirement: {
              quantity: {
                greaterThanOrEqualToQuantity: "2",
              },
            },
            customerGets: {
              value: discountAmount,
              items: { all: true },
            },
          },
        };

        const response = await fetch(
          `https://${shop}/admin/api/2024-01/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": session.accessToken,
            },
            body: JSON.stringify({ query: mutation, variables }),
          }
        );

        const data = await response.json();
        console.log("Discount result:", JSON.stringify(data));
      } catch (e) {
        console.error("Discount creation failed:", e);
      }
    }
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

  return redirect(`/app/bundles?shop=${shop}`);
};

export default function Bundles() {
  const { bundles, shop } = useLoaderData();
  const [showForm, setShowForm] = useState(false);

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
        <form
          method="POST"
          action={`https://smart-bundle-boost-eight.vercel.app/app/bundles?shop=${shop}`}
          style={{ display: "inline" }}
        >
          <input type="hidden" name="action" value="toggle" />
          <input type="hidden" name="bundleId" value={bundle.id} />
          <input type="hidden" name="currentActive" value={String(bundle.active)} />
          <input type="hidden" name="shop" value={shop} />
          <button
            type="submit"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#2c6ecb", fontSize: "14px" }}
          >
            {bundle.active ? "Deactivate" : "Activate"}
          </button>
        </form>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <form
          method="POST"
          action={`https://smart-bundle-boost-eight.vercel.app/app/bundles?shop=${shop}`}
          style={{ display: "inline" }}
        >
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="bundleId" value={bundle.id} />
          <input type="hidden" name="shop" value={shop} />
          <button
            type="submit"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#d72c0d", fontSize: "14px" }}
          >
            Delete
          </button>
        </form>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="Manage Bundles"
      backAction={{ url: "/app" }}
      primaryAction={{
        content: showForm ? "Cancel" : "New Bundle",
        onAction: () => setShowForm(!showForm),
      }}
    >
      <Layout>
        {showForm && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Create New Bundle</Text>
                <form
                  method="POST"
                  action={`https://smart-bundle-boost-eight.vercel.app/app/bundles?shop=${shop}`}
                >
                  <input type="hidden" name="action" value="create" />
                  <input type="hidden" name="shop" value={shop} />
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
                      style={{
                        backgroundColor: "#008060",
                        color: "white",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Save Bundle
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