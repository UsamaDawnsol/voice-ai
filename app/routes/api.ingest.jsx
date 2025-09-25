import { json } from "@remix-run/node";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { shop, type = "full" } = await request.json();
    
    if (!shop) {
      return json({ error: "Shop is required" }, { status: 400 });
    }

    // Get merchant from database
    const merchant = await db.merchant.findUnique({
      where: { shop: shop }
    });

    if (!merchant) {
      return json({ error: "Merchant not found" }, { status: 404 });
    }

    // Create ingestion job
    const job = await db.ingestionJob.create({
      data: {
        merchantId: merchant.id,
        type: type,
        status: "running",
        progress: 0,
        total: 0
      }
    });

    // Start ingestion process (in production, this would be a background job)
    const result = await ingestStoreData(merchant, job.id);

    return json({ 
      success: true, 
      jobId: job.id,
      result: result
    });

  } catch (error) {
    console.error("Ingestion error:", error);
    return json({ 
      error: "Failed to start ingestion process"
    }, { status: 500 });
  }
};

// Ingest store data from Shopify
async function ingestStoreData(merchant, jobId) {
  try {
    const accessToken = merchant.accessToken;
    const shop = merchant.shop;
    
    // Update job status
    await db.ingestionJob.update({
      where: { id: jobId },
      data: { status: "running", progress: 0 }
    });

    let totalProcessed = 0;
    const results = {
      products: 0,
      collections: 0,
      pages: 0,
      errors: []
    };

    // Ingest Products
    try {
      const products = await fetchShopifyData(shop, accessToken, 'products');
      for (const product of products) {
        await processProduct(product, merchant.id);
        results.products++;
        totalProcessed++;
        
        // Update progress
        await db.ingestionJob.update({
          where: { id: jobId },
          data: { progress: totalProcessed }
        });
      }
    } catch (error) {
      results.errors.push(`Products: ${error.message}`);
    }

    // Ingest Collections
    try {
      const collections = await fetchShopifyData(shop, accessToken, 'collections');
      for (const collection of collections) {
        await processCollection(collection, merchant.id);
        results.collections++;
        totalProcessed++;
        
        // Update progress
        await db.ingestionJob.update({
          where: { id: jobId },
          data: { progress: totalProcessed }
        });
      }
    } catch (error) {
      results.errors.push(`Collections: ${error.message}`);
    }

    // Ingest Pages
    try {
      const pages = await fetchShopifyData(shop, accessToken, 'pages');
      for (const page of pages) {
        await processPage(page, merchant.id);
        results.pages++;
        totalProcessed++;
        
        // Update progress
        await db.ingestionJob.update({
          where: { id: jobId },
          data: { progress: totalProcessed }
        });
      }
    } catch (error) {
      results.errors.push(`Pages: ${error.message}`);
    }

    // Update job completion
    await db.ingestionJob.update({
      where: { id: jobId },
      data: { 
        status: "completed",
        progress: totalProcessed,
        total: totalProcessed,
        metadata: results
      }
    });

    return results;

  } catch (error) {
    // Update job with error
    await db.ingestionJob.update({
      where: { id: jobId },
      data: { 
        status: "failed",
        error: error.message
      }
    });
    
    throw error;
  }
}

// Fetch data from Shopify API
async function fetchShopifyData(shop, accessToken, resource) {
  const url = `https://${shop}/admin/api/2023-10/${resource}.json?limit=250`;
  
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${resource}: ${response.statusText}`);
  }

  const data = await response.json();
  return data[resource] || [];
}

// Process and store product data
async function processProduct(product, merchantId) {
  const content = `
Product: ${product.title}
Description: ${product.body_html || ''}
Price: ${product.variants?.[0]?.price || 'N/A'}
Vendor: ${product.vendor || ''}
Tags: ${product.tags || ''}
Handle: ${product.handle}
  `.trim();

  // Check if document already exists
  const existingDoc = await db.document.findFirst({
    where: {
      merchantId: merchantId,
      source: 'product',
      sourceId: product.id.toString()
    }
  });

  if (existingDoc) {
    // Update existing document
    await db.document.update({
      where: { id: existingDoc.id },
      data: {
        title: product.title,
        content: content,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new document
    await db.document.create({
      data: {
        merchantId: merchantId,
        source: 'product',
        sourceId: product.id.toString(),
        title: product.title,
        content: content,
        metadata: {
          price: product.variants?.[0]?.price,
          vendor: product.vendor,
          tags: product.tags,
          handle: product.handle
        }
      }
    });
  }
}

// Process and store collection data
async function processCollection(collection, merchantId) {
  const content = `
Collection: ${collection.title}
Description: ${collection.body_html || ''}
Handle: ${collection.handle}
  `.trim();

  const existingDoc = await db.document.findFirst({
    where: {
      merchantId: merchantId,
      source: 'collection',
      sourceId: collection.id.toString()
    }
  });

  if (existingDoc) {
    await db.document.update({
      where: { id: existingDoc.id },
      data: {
        title: collection.title,
        content: content,
        updatedAt: new Date()
      }
    });
  } else {
    await db.document.create({
      data: {
        merchantId: merchantId,
        source: 'collection',
        sourceId: collection.id.toString(),
        title: collection.title,
        content: content,
        metadata: {
          handle: collection.handle
        }
      }
    });
  }
}

// Process and store page data
async function processPage(page, merchantId) {
  const content = `
Page: ${page.title}
Content: ${page.body_html || ''}
Handle: ${page.handle}
  `.trim();

  const existingDoc = await db.document.findFirst({
    where: {
      merchantId: merchantId,
      source: 'page',
      sourceId: page.id.toString()
    }
  });

  if (existingDoc) {
    await db.document.update({
      where: { id: existingDoc.id },
      data: {
        title: page.title,
        content: content,
        updatedAt: new Date()
      }
    });
  } else {
    await db.document.create({
      data: {
        merchantId: merchantId,
        source: 'page',
        sourceId: page.id.toString(),
        title: page.title,
        content: content,
        metadata: {
          handle: page.handle
        }
      }
    });
  }
}
