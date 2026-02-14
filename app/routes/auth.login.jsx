import { redirect } from "@remix-run/node";
import { login } from "~/shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  if (shop) {
    return redirect(await login(request));
  }
  return null;
};

export default function AuthLogin() {
  return null;
}