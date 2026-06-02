import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function createMcpClient() {
    // 1. Define the transport (how to connect to the server)
    const transport = new StdioClientTransport({
        command: "node", // or the absolute path to your node executable
        args: ["/Users/apple/Projects/backend/mcp-server/gmail/build/index.js"],
        env: {
            // Include necessary environment variables
            ...process.env,
            CREDENTIALS_PATH: "/Users/apple/Projects/backend/mcp-server/gmail/credentials.json",
            TOKEN_PATH: "/Users/apple/Projects/backend/mcp-server/gmail/token.json"
        }
    });

    // 2. Initialize the client
    const client = new Client(
        {
            name: "aiChat-backend-client",
            version: "1.0.0"
        },
        {
            capabilities: {}
        }
    );

    // 3. Connect to the server
    await client.connect(transport);

    return client;
}
