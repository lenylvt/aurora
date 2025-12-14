"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getConfiguredServers } from "@/lib/composio/client";
import type { MCPServerConfig } from "@/types/mcp-server";
import { Loader2, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import mcpServersConfig from "@/mcp-servers.json";

interface Connection {
  id: string;
  appUniqueId: string;
  integrationId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingServer, setConnectingServer] = useState<string | null>(null);

  const servers: MCPServerConfig[] = mcpServersConfig.servers;

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/composio/connections");
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (server: MCPServerConfig) => {
    setConnectingServer(server.id);
    try {
      const response = await fetch("/api/composio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit: server.toolkit }),
      });

      const data = await response.json();

      if (data.authUrl) {
        // Redirect to OAuth page
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to initiate connection");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Failed to connect to " + server.name);
    } finally {
      setConnectingServer(null);
    }
  };

  const handleDisconnect = async (connectionId: string, serverName: string) => {
    try {
      const response = await fetch("/api/composio/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (response.ok) {
        toast.success(`Disconnected from ${serverName}`);
        fetchConnections();
      } else {
        toast.error("Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect");
    }
  };

  const isConnected = (toolkit: string) => {
    return connections.some((conn) => conn.appUniqueId === toolkit);
  };

  const getConnection = (toolkit: string) => {
    return connections.find((conn) => conn.appUniqueId === toolkit);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MCP Connections</h1>
        <p className="text-muted-foreground mt-2">
          Connect external services to enhance your AI assistant with additional capabilities
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {servers.map((server) => {
          const connected = isConnected(server.toolkit);
          const connection = getConnection(server.toolkit);

          return (
            <Card key={server.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {server.name}
                      {connected ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not connected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {server.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  {server.allowedTools && server.allowedTools.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Available Tools:</p>
                      <div className="flex flex-wrap gap-1">
                        {server.allowedTools.slice(0, 3).map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool.split("_").slice(1).join(" ").toLowerCase()}
                          </Badge>
                        ))}
                        {server.allowedTools.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{server.allowedTools.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    {connected ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() =>
                          handleDisconnect(connection!.id, server.name)
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(server)}
                        disabled={connectingServer === server.id}
                      >
                        {connectingServer === server.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
