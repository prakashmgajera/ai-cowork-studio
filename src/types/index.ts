import type { Agent, AgentConnector, ConnectorType, Document, Project } from "@prisma/client";

export type ProjectWithCounts = Project & {
  _count: {
    agents: number;
    documents: number;
  };
};

export type AgentWithConnectors = Agent & {
  connectors: AgentConnector[];
};

export type DocumentWithChunkCount = Document & {
  _count: {
    chunks: number;
  };
};

export type ConnectorConfig =
  | GmailConnectorConfig
  | OneDriveConnectorConfig
  | GoogleDriveConnectorConfig
  | SlackConnectorConfig
  | MCPLocalConnectorConfig
  | MCPRemoteConnectorConfig;

export type GmailConnectorConfig = {
  type: "GMAIL";
  accessToken?: string;
  refreshToken?: string;
  email?: string;
};

export type OneDriveConnectorConfig = {
  type: "ONEDRIVE";
  accessToken?: string;
  refreshToken?: string;
};

export type GoogleDriveConnectorConfig = {
  type: "GOOGLE_DRIVE";
  accessToken?: string;
  refreshToken?: string;
};

export type SlackConnectorConfig = {
  type: "SLACK";
  botToken?: string;
  teamId?: string;
};

export type MCPLocalConnectorConfig = {
  type: "MCP_LOCAL";
  command: string;
  args?: string[];
  env?: Record<string, string>;
};

export type MCPRemoteConnectorConfig = {
  type: "MCP_REMOTE";
  url: string;
  headers?: Record<string, string>;
};

export const CONNECTOR_TYPE_LABELS: Record<ConnectorType, string> = {
  GMAIL: "Gmail",
  ONEDRIVE: "OneDrive",
  GOOGLE_DRIVE: "Google Drive",
  SLACK: "Slack",
  NOTION: "Notion",
  MCP_LOCAL: "MCP (Local)",
  MCP_REMOTE: "MCP (Remote)",
};

export const CONNECTOR_TYPE_ICONS: Record<ConnectorType, string> = {
  GMAIL: "mail",
  ONEDRIVE: "cloud",
  GOOGLE_DRIVE: "hard-drive",
  SLACK: "hash",
  NOTION: "file-text",
  MCP_LOCAL: "terminal",
  MCP_REMOTE: "globe",
};

export const SUPPORTED_MODELS = [
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 (Most capable)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (Recommended)" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (Fastest)" },
] as const;
