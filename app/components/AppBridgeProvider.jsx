import { useEffect } from "react";
import { useLocation, useNavigate } from "@remix-run/react";

export function AppBridgeProvider({ children, config }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && window.shopify) {
      const shopify = window.shopify;
      
      // Configure App Bridge
      const app = shopify.app({
        apiKey: config.apiKey,
        host: config.host,
      });

      // Handle navigation
      app.subscribe("Redirect", (data) => {
        navigate(data.path);
      });
    }
  }, [config.apiKey, config.host, navigate]);

  return <>{children}</>;
}