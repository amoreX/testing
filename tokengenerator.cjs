// getGoogleToken.js - Run this script to get your refresh token

const { google } = require("googleapis");
const http = require("http");
const url = require("url");
const openModule = require("open");
const open = openModule.default;

// Replace these with your OAuth 2.0 credentials from Google Cloud Console
const CLIENT_ID =
  "401330684675-fg8cd3tlr7iutj9l9ckh3rop07q7ctfj.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Define scopes - these are the permissions your app needs
const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

async function getRefreshToken() {
  return new Promise((resolve, reject) => {
    try {
      console.log("🚀 Starting Google OAuth2 setup...\n");

      // Create server to handle OAuth callback
      const server = http.createServer(async (req, res) => {
        try {
          const queryParams = url.parse(req.url, true).query;

          if (req.url.includes("/oauth2callback")) {
            if (queryParams.error) {
              console.error("❌ OAuth Error:", queryParams.error);
              res.writeHead(400, { "Content-Type": "text/html" });
              res.end(`
                <html>
                  <body style="font-family: Arial; padding: 50px; text-align: center;">
                    <h2>❌ Authentication Failed</h2>
                    <p>Error: ${queryParams.error}</p>
                    <p>Please check the console and try again.</p>
                  </body>
                </html>
              `);
              server.close();
              reject(new Error(queryParams.error));
              return;
            }

            if (queryParams.code) {
              console.log("✅ Authorization code received!");
              console.log("🔄 Exchanging code for tokens...\n");

              // Exchange authorization code for tokens
              const { tokens } = await oauth2Client.getToken(queryParams.code);

              console.log("🎉 SUCCESS! Here are your tokens:\n");
              console.log("=".repeat(60));
              console.log("CLIENT_ID:", CLIENT_ID);
              console.log("CLIENT_SECRET:", CLIENT_SECRET);
              console.log("REDIRECT_URI:", REDIRECT_URI);
              console.log("REFRESH_TOKEN:", tokens.refresh_token);
              console.log("=".repeat(60));
              console.log("\n📋 Copy these to your .env file:");
              console.log(`
GOOGLE_CLIENT_ID=${CLIENT_ID}
GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}
GOOGLE_REDIRECT_URI=${REDIRECT_URI}
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
              `);

              // Send success response
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(`
                <html>
                  <body style="font-family: Arial; padding: 50px; text-align: center;">
                    <h2>🎉 Authentication Successful!</h2>
                    <p>Your refresh token has been generated successfully.</p>
                    <p>Check your terminal/console for the token details.</p>
                    <p>You can now close this window.</p>
                    <script>setTimeout(() => window.close(), 3000);</script>
                  </body>
                </html>
              `);

              // Close server after a short delay
              setTimeout(() => {
                server.close();
                resolve(tokens);
              }, 1000);
            }
          } else {
            // Handle root path
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: Arial; padding: 50px; text-align: center;">
                  <h2>🔄 Google OAuth2 Setup</h2>
                  <p>Server is running and waiting for OAuth callback...</p>
                  <p>If you haven't been redirected automatically, please check your terminal.</p>
                </body>
              </html>
            `);
          }
        } catch (error) {
          console.error("❌ Error processing callback:", error);
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h2>❌ Server Error</h2>
                <p>An error occurred: ${error.message}</p>
                <p>Please check the console for details.</p>
              </body>
            </html>
          `);
          server.close();
          reject(error);
        }
      });

      server.listen(3000, () => {
        console.log("🌐 OAuth server started on http://localhost:3000");

        // Generate authorization URL
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: "offline", // Required for refresh token
          scope: scopes,
          prompt: "consent", // Force consent screen to ensure refresh token
          include_granted_scopes: true,
        });

        console.log("🔗 Opening authorization URL in your browser...");
        console.log("📋 If it doesn't open automatically, copy this URL:\n");
        console.log(authUrl);
        console.log("\n⏳ Waiting for you to complete the authorization...\n");

        // Try to open browser automatically
        open(authUrl).catch(() => {
          console.log(
            "ℹ️  Could not open browser automatically. Please copy the URL above."
          );
        });
      });

      // Handle server errors
      server.on("error", (error) => {
        console.error("❌ Server error:", error);
        reject(error);
      });
    } catch (error) {
      console.error("❌ Setup error:", error);
      reject(error);
    }
  });
}

// Validate configuration before starting
function validateConfig() {
  if (CLIENT_ID === "YOUR_CLIENT_ID_HERE" || !CLIENT_ID) {
    console.error(
      "❌ Please update CLIENT_ID in this script with your actual Google OAuth Client ID"
    );
    process.exit(1);
  }

  if (CLIENT_SECRET === "YOUR_CLIENT_SECRET_HERE" || !CLIENT_SECRET) {
    console.error(
      "❌ Please update CLIENT_SECRET in this script with your actual Google OAuth Client Secret"
    );
    process.exit(1);
  }

  console.log("✅ Configuration validated");
}

// Main execution
async function main() {
  try {
    console.log("🔧 Google Calendar OAuth2 Token Generator\n");

    validateConfig();

    console.log("📋 Current configuration:");
    console.log(`   Client ID: ${CLIENT_ID.substring(0, 20)}...`);
    console.log(`   Client Secret: ${CLIENT_SECRET.substring(0, 10)}...`);
    console.log(`   Redirect URI: ${REDIRECT_URI}\n`);

    const tokens = await getRefreshToken();

    console.log("\n✅ Token generation completed successfully!");
    console.log("💡 Next steps:");
    console.log(
      "   1. Copy the environment variables shown above to your .env file"
    );
    console.log("   2. Build and run your MCP server");
    console.log("   3. Configure Claude Desktop with your server path\n");
  } catch (error) {
    console.error("\n❌ Token generation failed:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down gracefully...");
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}
