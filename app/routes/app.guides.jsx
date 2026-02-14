import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return json({ ok: true });
};

export default function Guides() {
  const guides = [
    {
      id: 1,
      title: "Créer votre première fiche produit",
      category: "Produits",
      steps: [
        "Allez dans Produits → Ajouter un produit",
        "Ajoutez un titre clair et descriptif",
        "Rédigez une description détaillée (min. 100 mots)",
        "Ajoutez au moins 3 photos de qualité",
        "Définissez le prix et le stock",
        "Cliquez sur Enregistrer",
      ],
    },
    {
      id: 2,
      title: "Configurer votre politique de retour",
      category: "Légal",
      steps: [
        "Allez dans Paramètres → Politique",
        "Cliquez sur Politique de remboursement",
        "Rédigez votre politique (délai, conditions)",
        "Enregistrez la politique",
        "Vérifiez qu'elle apparaît dans votre boutique",
      ],
    },
    {
      id: 3,
      title: "Configurer la livraison",
      category: "Livraison",
      steps: [
        "Allez dans Paramètres → Livraison et livraison",
        "Créez un profil de livraison",
        "Ajoutez vos zones de livraison",
        "Définissez vos tarifs",
        "Activez la livraison gratuite si possible",
      ],
    },
    {
      id: 4,
      title: "Optimiser vos images produits",
      category: "Design",
      steps: [
        "Utilisez des images en haute résolution (min. 1000x1000px)",
        "Fond blanc pour les photos principales",
        "Ajoutez plusieurs angles du produit",
        "Compressez les images pour la rapidité",
        "Nommez les fichiers avec des mots-clés",
      ],
    },
    {
      id: 5,
      title: "Ajouter un domaine personnalisé",
      category: "Configuration",
      steps: [
        "Achetez un domaine (ex: monshop.fr)",
        "Allez dans Paramètres → Domaines",
        "Cliquez sur Connecter un domaine existant",
        "Suivez les instructions DNS",
        "Attendez la propagation (24-48h)",
      ],
    },
    {
      id: 6,
      title: "Configurer les paiements",
      category: "Paiements",
      steps: [
        "Allez dans Paramètres → Paiements",
        "Activez Shopify Payments (recommandé)",
        "Ajoutez PayPal comme alternative",
        "Configurez les devises acceptées",
        "Testez un paiement en mode test",
      ],
    },
  ];

  const categories = [...new Set(guides.map(g => g.category))];

  return (
    <Page title="Guides d'optimisation" backAction={{ url: "/app" }}>
      <Layout>
        {categories.map(cat => (
          <Layout.Section key={cat}>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">{cat}</Text>
              <InlineStack gap="400" wrap>
                {guides.filter(g => g.category === cat).map(guide => (
                  <Box key={guide.id} minWidth="300px">
                    <Card>
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <Text variant="headingSm" fontWeight="bold">{guide.title}</Text>
                          <Badge>{guide.category}</Badge>
                        </InlineStack>
                        <BlockStack gap="200">
                          {guide.steps.map((step, i) => (
                            <InlineStack key={i} gap="200">
                              <Text tone="subdued">{i + 1}.</Text>
                              <Text>{step}</Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  </Box>
                ))}
              </InlineStack>
            </BlockStack>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  );
}