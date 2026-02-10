import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: host || "",
  });
};

export default function App() {
  const { apiKey, host } = useLoaderData();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          defer
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.shopifyConfig = {
                apiKey: "${apiKey}",
                host: "${host}"
              };
            `,
          }}
        />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}