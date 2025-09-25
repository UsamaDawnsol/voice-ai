import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import debugLogger from "../utils/debug.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    debugLogger.info('Script tags debug requested', {
      shop: session.shop,
      user: session.id
    });

    // Get all script tags
    const scriptTagsResponse = await admin.graphql(`
      query {
        scriptTags(first: 50) {
          edges {
            node {
              id
              src
              displayScope
              createdAt
            }
          }
        }
      }
    `);
    
    const scriptTagsData = await scriptTagsResponse.json();
    const scriptTags = scriptTagsData.data?.scriptTags?.edges || [];
    
    // Find our Voice AI widget script tag
    const ourScriptTag = scriptTags.find(
      edge => edge.node.src.includes('/embed?shop=')
    );
    
    const debugInfo = {
      shop: session.shop,
      timestamp: new Date().toISOString(),
      totalScriptTags: scriptTags.length,
      ourScriptTag: ourScriptTag ? {
        id: ourScriptTag.node.id,
        src: ourScriptTag.node.src,
        displayScope: ourScriptTag.node.displayScope,
        createdAt: ourScriptTag.node.createdAt
      } : null,
      allScriptTags: scriptTags.map(edge => ({
        id: edge.node.id,
        src: edge.node.src,
        displayScope: edge.node.displayScope,
        createdAt: edge.node.createdAt
      })),
      embedUrl: `${process.env.SHOPIFY_APP_URL}/embed?shop=${session.shop}`,
      isEmbedded: !!ourScriptTag
    };

    debugLogger.debug('Script tags debug completed', {
      shop: session.shop,
      totalScriptTags: debugInfo.totalScriptTags,
      isEmbedded: debugInfo.isEmbedded
    });

    return json(debugInfo, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    debugLogger.error('Failed to get script tags debug info', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to retrieve script tags information",
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

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get('action');
    
    debugLogger.info('Script tags action requested', {
      shop: session.shop,
      user: session.id,
      action
    });

    if (action === 'add') {
      // Add script tag
      const embedUrl = `${process.env.SHOPIFY_APP_URL}/embed?shop=${session.shop}`;
      
      const createResponse = await admin.graphql(`
        mutation scriptTagCreate($input: ScriptTagInput!) {
          scriptTagCreate(input: $input) {
            scriptTag {
              id
              src
              displayScope
            }
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          input: {
            src: embedUrl,
            displayScope: "ONLINE_STORE"
          }
        }
      });
      
      const createResult = await createResponse.json();
      
      if (createResult.data?.scriptTagCreate?.userErrors?.length > 0) {
        return json({
          success: false,
          error: createResult.data.scriptTagCreate.userErrors[0].message,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
      
      return json({
        success: true,
        message: 'Script tag added successfully',
        scriptTagId: createResult.data?.scriptTagCreate?.scriptTag?.id,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'remove') {
      // Find and remove our script tag
      const existingScriptsResponse = await admin.graphql(`
        query {
          scriptTags(first: 50) {
            edges {
              node {
                id
                src
                displayScope
              }
            }
          }
        }
      `);
      
      const existingScripts = await existingScriptsResponse.json();
      const ourScript = existingScripts.data?.scriptTags?.edges?.find(
        edge => edge.node.src.includes('/embed?shop=')
      );
      
      if (ourScript) {
        const deleteResponse = await admin.graphql(`
          mutation scriptTagDelete($id: ID!) {
            scriptTagDelete(id: $id) {
              deletedScriptTagId
              userErrors {
                field
                message
              }
            }
          }
        `, {
          variables: {
            id: ourScript.node.id
          }
        });
        
        const deleteResult = await deleteResponse.json();
        
        if (deleteResult.data?.scriptTagDelete?.userErrors?.length > 0) {
          return json({
            success: false,
            error: deleteResult.data.scriptTagDelete.userErrors[0].message,
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        return json({
          success: true,
          message: 'Script tag removed successfully',
          deletedScriptTagId: deleteResult.data?.scriptTagDelete?.deletedScriptTagId,
          timestamp: new Date().toISOString()
        });
      } else {
        return json({
          success: true,
          message: 'No script tag found to remove',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return json({
      error: 'Invalid action',
      timestamp: new Date().toISOString()
    }, { status: 400 });
    
  } catch (error) {
    debugLogger.error('Script tags action failed', {
      error: error.message,
      stack: error.stack
    });

    return json({
      error: "Failed to perform script tags action",
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



