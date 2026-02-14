import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  ProgressBar,
  Badge,
  InlineStack,
  Button,
  Box,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const productsRes = await admin.graphql(`
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            description
            images(first: 1) { edges { node { id } } }
          }
        }
      }
    }
  `);
  const productsData = await productsRes.json();
  const products = productsData.data?.products?.edges || [];

  const shopRes = await admin.graphql(`
    query {
      shop {
        name
      }
    }
  `);
  const shopData = await shopRes.json();
  const shopName = shopData.data?.shop?.name || shop;

  const totalProducts = products.length;
  const productsWithImages = products.filter(p => p.node.images.edges.length > 0).length;
  const productsWithDesc = products.filter(p => p.node.description?.length > 10).length;

  let productScore = 0;
  if (totalProducts >= 10) productScore += 15;
  else if (totalProducts >= 5) productScore += 8;
  else if (totalProducts >= 1) productScore += 4;
  if (totalProducts > 0 && productsWithImages === totalProducts) productScore += 15;
  else if (totalProducts > 0 && productsWithImages / totalProducts > 0.7) productScore += 8;

  let descScore = 0;
  if (totalProducts > 0 && productsWithDesc / totalProducts > 0.8) descScore = 20;
  else if (totalProducts > 0 && productsWithDesc / totalProducts > 0.5) descScore = 10;

  const baseScore = 25;
  const totalScore = Math.min(100, productScore + descScore + baseScore);

  const checklist = [
    { id: 1, task: "Ajouter au moins 10 produits", done: totalProducts >= 10, priority: "high" },
    { id: 2, task: "Ajouter des images à tous vos produits", done: totalProducts > 0 && productsWithImages === totalProducts, priority: "high" },
    { id: 3, task: "Ajouter des descriptions à vos produits", done: totalProducts > 0 && productsWithDesc / totalProducts > 0.8, priority: "medium" },
    { id: 4, task: "Configurer votre politique de retour", done: false, priority: "high" },
    { id: 5, task: "Ajouter une page de contact", done: false, priority: "medium" },
  ];

  return json({ shop, shopName, totalScore, totalProducts, productsWithImages, productsWithDesc, checklist });
};

export default function Dashboard() {
  const { shopName, totalScore, totalProducts, productsWithImages, productsWithDesc, checklist } = useLoaderData();

  const scoreColor = totalScore >= 70 ? "success" : totalScore >= 40 ? "warning" : "critical";
  const doneTasks = checklist.filter(t => t.done).length;

  return (
    <Page title={`StoreScore — ${shopName}`}>
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">Score de votre boutique</Text>
                <Badge tone={scoreColor}>{totalScore}/100</Badge>
              </InlineStack>
              <ProgressBar progress={totalScore} tone={scoreColor} />
              <Text tone="subdued">
                {totalScore >= 70 ? "🎉 Excellente boutique ! Continuez comme ça."
                  : totalScore >= 40 ? "👍 Bonne base, mais il reste des améliorations importantes."
                  : "⚠️ Votre boutique a besoin d'améliorations urgentes."}
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingSm" tone="subdued">Produits</Text>
                  <Text variant="headingXl">{totalProducts}</Text>
                  <Text tone="subdued">{totalProducts >= 10 ? "✅ Suffisant" : "❌ Ajoutez plus de produits"}</Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingSm" tone="subdued">Avec images</Text>
                  <Text variant="headingXl">{productsWithImages}/{totalProducts}</Text>
                  <Text tone="subdued">{totalProducts > 0 && productsWithImages === totalProducts ? "✅ Complet" : "❌ Manque des images"}</Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingSm" tone="subdued">Avec descriptions</Text>
                  <Text variant="headingXl">{productsWithDesc}/{totalProducts}</Text>
                  <Text tone="subdued">{totalProducts > 0 && productsWithDesc === totalProducts ? "✅ Complet" : "❌ Manque des descriptions"}</Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text variant="headingSm" tone="subdued">Checklist</Text>
                  <Text variant="headingXl">{doneTasks}/{checklist.length}</Text>
                  <Text tone="subdued">tâches complétées</Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Checklist d'optimisation</Text>
              {checklist.map(item => (
                <InlineStack key={item.id} align="space-between" gap="400">
                  <InlineStack gap="300">
                    <Text>{item.done ? "✅" : "❌"}</Text>
                    <Text tone={item.done ? "subdued" : undefined}>
                      {item.task}
                    </Text>
                  </InlineStack>
                  <Badge tone={item.priority === "high" ? "critical" : "warning"}>
                    {item.priority === "high" ? "Urgent" : "Important"}
                  </Badge>
                </InlineStack>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <InlineStack gap="300">
            <Button variant="primary" url="/app/guides">
              Voir les guides
            </Button>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}