/**
 * MCP (Model Context Protocol) integration layer.
 *
 * Supports connecting to both local (stdio) and remote (SSE/HTTP) MCP servers.
 * Each agent can have multiple MCP connectors configured via AgentConnector records.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export type MCPTool = {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

export type MCPServerConfig =
  | {
      type: "local";
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }
  | {
      type: "remote";
      url: string;
      headers?: Record<string, string>;
    };

export async function getMCPTools(config: MCPServerConfig): Promise<MCPTool[]> {
  const client = new Client({ name: "ai-cowork-studio", version: "1.0.0" });

  try {
    if (config.type === "local") {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });
      await client.connect(transport);
    } else {
      const transport = new SSEClientTransport(new URL(config.url));
      await client.connect(transport);
    }

    const { tools } = await client.listTools();
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown>,
    }));
  } finally {
    await client.close();
  }
}

export async function callMCPTool(
  config: MCPServerConfig,
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  const client = new Client({ name: "ai-cowork-studio", version: "1.0.0" });

  try {
    if (config.type === "local") {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });
      await client.connect(transport);
    } else {
      const transport = new SSEClientTransport(new URL(config.url));
      await client.connect(transport);
    }

    const result = await client.callTool({ name: toolName, arguments: toolInput });
    const content = result.content as Array<{ type: string; text?: string }>;
    return content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("\n");
  } finally {
    await client.close();
  }
}
