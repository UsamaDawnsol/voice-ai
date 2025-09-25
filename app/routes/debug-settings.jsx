import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    return new Response("Shop parameter required", { status: 400 });
  }

  try {
    // Get widget configuration from database
    const widgetSettings = await db.widgetSettings.findUnique({
      where: { shop: shop }
    });

    const debugInfo = {
      shop: shop,
      timestamp: new Date().toISOString(),
      settings: widgetSettings,
      settingsExists: !!widgetSettings,
      embedUrl: `${process.env.SHOPIFY_APP_URL}/embed?shop=${shop}&t=${Date.now()}`
    };

    return json(debugInfo, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    return json({
      error: error.message,
      shop: shop,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
