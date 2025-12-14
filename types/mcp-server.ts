export type AuthType = "oauth2" | "api_key" | "basic";

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  toolkit: string;
  requiresAuth: boolean;
  authType?: AuthType;
  icon?: string;
  allowedTools?: string[];
}

export interface MCPServersConfig {
  servers: MCPServerConfig[];
}

export interface UserConnection {
  userId: string;
  serverId: string;
  toolkit: string;
  authConfigId: string;
  connectedAccountId?: string;
  status: "connected" | "disconnected" | "pending";
  connectedAt?: Date;
  error?: string;
}

export interface ComposioToolCall {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
}
