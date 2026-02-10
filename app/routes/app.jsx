import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { Outlet } from "@remix-run/react";

export default function AppLayout() {
  return (
    <AppProvider i18n={{}}>
      <Outlet />
    </AppProvider>
  );
}