import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

class MCPClientManager {
  constructor() {
    this.clients = new Map();
  }

  async connectToServer(serverName, command, args, env = {}) {
    try {
      const transport = new StdioClientTransport({
        command,
        args,
        env: { ...process.env, ...env }
      });

      const client = new Client({
        name: `portfolio-insights-${serverName}`,
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await client.connect(transport);
      this.clients.set(serverName, client);

      console.log(`Connected to ${serverName} MCP server`);
      return client;
    } catch (error) {
      console.error(`Failed to connect to ${serverName}:`, error);
      throw error;
    }
  }

  async initializeServers() {
    // Note: Perplexity is now using direct HTTP API calls instead of MCP
    // No MCP servers are currently needed
    console.log('MCP client initialized (no servers configured)');
  }

  getClient(serverName) {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not initialized`);
    }
    return client;
  }

  async callTool(serverName, toolName, args) {
    try {
      const client = this.getClient(serverName);
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      return result;
    } catch (error) {
      console.error(`Error calling tool ${toolName} on ${serverName}:`, error);
      throw error;
    }
  }

  async close() {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`Closed connection to ${name}`);
      } catch (error) {
        console.error(`Error closing ${name}:`, error);
      }
    }
    this.clients.clear();
  }
}

export const mcpManager = new MCPClientManager();
