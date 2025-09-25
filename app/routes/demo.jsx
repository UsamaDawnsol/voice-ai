import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "demo-shop";
  
  return json({ shop });
};

export default function Demo() {
  const { shop } = useLoaderData();
  
  const styles = {
    body: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    },
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    },
    h1: {
      color: '#333',
      textAlign: 'center',
      marginBottom: '30px'
    },
    feature: {
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px 0',
      borderLeft: '4px solid #007bff'
    },
    code: {
      background: '#f1f3f4',
      padding: '15px',
      borderRadius: '6px',
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      margin: '10px 0',
      overflowX: 'auto'
    }
  };
  
  return (
    <html>
      <head>
        <title>Voice AI Widget Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          <h1 style={styles.h1}>🎤 Voice AI Widget Demo</h1>
          
          <div style={styles.feature}>
            <h3>Floating Widget</h3>
            <p>Look for the floating microphone icon in the bottom-right corner of this page. Click it to open the Voice AI chat interface!</p>
          </div>
          
          <div style={styles.feature}>
            <h3>Features</h3>
            <ul>
              <li>🎤 Voice input using browser speech recognition</li>
              <li>💬 Text-based chat interface</li>
              <li>🎨 Customizable colors and position</li>
              <li>📱 Mobile responsive design</li>
              <li>⚡ Easy installation via embed code</li>
            </ul>
          </div>
          
          <div style={styles.feature}>
            <h3>Installation Code</h3>
            <p>Add this code to any website to display the Voice AI widget:</p>
            <div style={styles.code}>
              {`<script src="${process.env.SHOPIFY_APP_URL}/embed?shop=${shop}"></script>`}
            </div>
          </div>
          
          <div style={styles.feature}>
            <h3>How to Use</h3>
            <ol>
              <li>Click the floating microphone icon</li>
              <li>Type a message or use the "Voice Input" button</li>
              <li>Speak into your microphone when prompted</li>
              <li>The AI will respond to your queries</li>
            </ol>
          </div>
        </div>
        
        {/* Load the Voice AI Widget */}
        <script src={`/embed?shop=${shop}`}></script>
      </body>
    </html>
  );
}
