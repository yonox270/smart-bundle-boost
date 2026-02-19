import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { AppProvider } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const host = url.searchParams.get("host") || "";
  return json({ 
    apiKey: process.env.SHOPIFY_API_KEY,
    shop,
    host,
  });
};

export default function App() {
  const { apiKey, host } = useLoaderData();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider i18n={{}}>
          {host ? (
            <AppBridgeProvider
              config={{
                apiKey,
                host,
                forceRedirect: true,
              }}
            >
              <Outlet />
            </AppBridgeProvider>
          ) : (
            <Outlet />
          )}
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}