import { json } from "@remix-run/node";
import prisma from "~/db.server";

export const action = async ({ request }) => {
  const formData = await request.formData();
  const shop = formData.get("shop");
  const bundleTitle = formData.get("title");
  const discountType = formData.get("discountType");
  const discountValue = parseFloat(formData.get("discountValue"));
  const actionType = formData.get("action");

  // Récupère le token du shop
  const shopData = await prisma.shop.findUnique({
    where: { shopDomain: shop },
  });

  if (!shopData?.accessToken) {
    return json({ error: "No access token found" }, { status: 401 });
  }

  const token = shopData.accessToken;

  if (actionType === "create") {
    // Crée une remise automatique dans Shopify
    const discountAmount = discountType === "PERCENTAGE"
      ? { percentage: discountValue / 100 }
      : { amount: { amount: discountValue, currencyCode: "USD" } };

    const mutation = `
      mutation CreateDiscount($input: DiscountAutomaticBasicInput!) {
        discountAutomaticBasicCreate(automaticBasicDiscount: $input) {
          automaticDiscountNode {
            id
            automaticDiscount {
              ... on DiscountAutomaticBasic {
                title
                status
              }
            }
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
        title: `Bundle: ${bundleTitle}`,
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
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const data = await response.json();
    const errors = data?.data?.discountAutomaticBasicCreate?.userErrors;

    if (errors && errors.length > 0) {
      return json({ error: errors[0].message }, { status: 400 });
    }

    const discountId = data?.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id;
    return json({ success: true, discountId });
  }

  return json({ success: false });
};