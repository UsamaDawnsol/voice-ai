import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import debugLogger from "../utils/debug.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    debugLogger.info('API test requested', {
      shop: session.shop,
      user: session.id
    });

    const testResults = {
      shop: session.shop,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Basic shop information
    try {
      const shopResponse = await admin.graphql(`
        query {
          shop {
            name
            id
            myshopifyDomain
            email
            currencyCode
            timezone
            plan {
              displayName
            }
          }
        }
      `);
      
      const shopData = await shopResponse.json();
      testResults.tests.shopInfo = {
        success: true,
        data: shopData.data?.shop || null,
        error: shopData.errors || null
      };
      
      debugLogger.debug('Shop info test completed', {
        shop: session.shop,
        success: !shopData.errors
      });
    } catch (error) {
      testResults.tests.shopInfo = {
        success: false,
        error: error.message
      };
      debugLogger.error('Shop info test failed', {
        error: error.message,
        shop: session.shop
      });
    }

    // Test 2: Products access
    try {
      const productsResponse = await admin.graphql(`
        query {
          products(first: 5) {
            edges {
              node {
                id
                title
                handle
                status
              }
            }
          }
        }
      `);
      
      const productsData = await productsResponse.json();
      testResults.tests.productsAccess = {
        success: true,
        count: productsData.data?.products?.edges?.length || 0,
        data: productsData.data?.products?.edges || [],
        error: productsData.errors || null
      };
      
      debugLogger.debug('Products access test completed', {
        shop: session.shop,
        productCount: testResults.tests.productsAccess.count
      });
    } catch (error) {
      testResults.tests.productsAccess = {
        success: false,
        error: error.message
      };
      debugLogger.error('Products access test failed', {
        error: error.message,
        shop: session.shop
      });
    }

    // Test 3: Orders access (if scope allows)
    try {
      const ordersResponse = await admin.graphql(`
        query {
          orders(first: 5) {
            edges {
              node {
                id
                name
                createdAt
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      `);
      
      const ordersData = await ordersResponse.json();
      testResults.tests.ordersAccess = {
        success: true,
        count: ordersData.data?.orders?.edges?.length || 0,
        data: ordersData.data?.orders?.edges || [],
        error: ordersData.errors || null
      };
      
      debugLogger.debug('Orders access test completed', {
        shop: session.shop,
        orderCount: testResults.tests.ordersAccess.count
      });
    } catch (error) {
      testResults.tests.ordersAccess = {
        success: false,
        error: error.message
      };
      debugLogger.error('Orders access test failed', {
        error: error.message,
        shop: session.shop
      });
    }

    // Test 4: Theme access
    try {
      const themesResponse = await admin.graphql(`
        query {
          themes(first: 5) {
            edges {
              node {
                id
                name
                role
                createdAt
              }
            }
          }
        }
      `);
      
      const themesData = await themesResponse.json();
      testResults.tests.themesAccess = {
        success: true,
        count: themesData.data?.themes?.edges?.length || 0,
        data: themesData.data?.themes?.edges || [],
        error: themesData.errors || null
      };
      
      debugLogger.debug('Themes access test completed', {
        shop: session.shop,
        themeCount: testResults.tests.themesAccess.count
      });
    } catch (error) {
      testResults.tests.themesAccess = {
        success: false,
        error: error.message
      };
      debugLogger.error('Themes access test failed', {
        error: error.message,
        shop: session.shop
      });
    }

    // Test 5: App installation info
    try {
      const appResponse = await admin.graphql(`
        query {
          currentAppInstallation {
            id
            launchUrl
            uninstallUrl
            app {
              id
              title
              handle
            }
          }
        }
      `);
      
      const appData = await appResponse.json();
      testResults.tests.appInstallation = {
        success: true,
        data: appData.data?.currentAppInstallation || null,
        error: appData.errors || null
      };
      
      debugLogger.debug('App installation test completed', {
        shop: session.shop,
        success: !appData.errors
      });
    } catch (error) {
      testResults.tests.appInstallation = {
        success: false,
        error: error.message
      };
      debugLogger.error('App installation test failed', {
        error: error.message,
        shop: session.shop
      });
    }

    // Calculate overall success rate
    const testCount = Object.keys(testResults.tests).length;
    const successCount = Object.values(testResults.tests).filter(test => test.success).length;
    testResults.summary = {
      totalTests: testCount,
      successfulTests: successCount,
      failedTests: testCount - successCount,
      successRate: Math.round((successCount / testCount) * 100)
    };

    debugLogger.info('API tests completed', {
      shop: session.shop,
      successRate: testResults.summary.successRate,
      totalTests: testResults.summary.totalTests
    });

    return json(testResults, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    debugLogger.error('API test failed', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to run API tests",
      message: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

