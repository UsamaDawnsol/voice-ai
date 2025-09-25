import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop parameter required" }, { status: 400 });
  }

  try {
    // Get current widget settings
    const widgetSettings = await db.widgetSettings.findUnique({
      where: { shop: shop }
    });

    // Get embed script URL
    const embedUrl = `${process.env.SHOPIFY_APP_URL}/embed?shop=${shop}&t=${Date.now()}`;

    return json({
      shop: shop,
      timestamp: new Date().toISOString(),
      widgetSettings: widgetSettings,
      embedUrl: embedUrl,
      hasSettings: !!widgetSettings,
      settingsActive: widgetSettings?.isActive || false
    });
  } catch (error) {
    return json({ 
      error: "Failed to get widget settings",
      details: error.message 
    }, { status: 500 });
  }
};
