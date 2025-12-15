"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Loader2, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

interface Toolkit {
  id: string;
  name: string;
  toolkit: string;
  description: string;
  hasAuthConfig: boolean;
  isConnected: boolean;
  connectionId?: string;
  connectionStatus?: string;
  allowedTools: string[];
}

export default function ConnectionsTab() {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingToolkit, setConnectingToolkit] = useState<string | null>(null);

  useEffect(() => {
    fetchToolkits();
  }, []);

  const fetchToolkits = async () => {
    try {
      const jwt = await getSessionJWT();
      if (!jwt) {
        toast.error("Non authentifié");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/composio/toolkits", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setToolkits(data.toolkits || []);
    } catch (error) {
      console.error("Error fetching toolkits:", error);
      toast.error("Échec du chargement des outils");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (toolkit: Toolkit) => {
    if (!toolkit.hasAuthConfig) {
      toast.error(`Aucun Auth Config ID pour ${toolkit.name}`);
      return;
    }

    setConnectingToolkit(toolkit.id);
    try {
      const jwt = await getSessionJWT();
      const callbackUrl = `${window.location.origin}/api/composio/callback`;

      const response = await fetch("/api/composio/auth/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          toolkit: toolkit.toolkit,
          callbackUrl,
        }),
      });

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error(data.error || "Échec de la connexion");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error("Échec de la connexion");
    } finally {
      setConnectingToolkit(null);
    }
  };

  const handleDisconnect = async (toolkit: Toolkit) => {
    if (!toolkit.connectionId) return;

    try {
      const jwt = await getSessionJWT();
      const response = await fetch("/api/composio/connections", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ connectionId: toolkit.connectionId }),
      });

      if (response.ok) {
        toast.success(`Déconnecté de ${toolkit.name}`);
        fetchToolkits();
      } else {
        const data = await response.json();
        toast.error(data.error || "Échec de la déconnexion");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Échec de la déconnexion");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full p-6 sm:p-8 space-y-6 overflow-auto">
      <div>
        <h2 className="text-xl font-semibold">Connexions</h2>
        <p className="text-sm text-muted-foreground">Services connectés à Aurora</p>
      </div>

      {toolkits.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucun service disponible</p>
        </div>
      ) : (
        <div className="space-y-2">
          {toolkits.map((toolkit) => (
            <div
              key={toolkit.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              {/* Status indicator */}
              {toolkit.isConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : toolkit.hasAuthConfig ? (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{toolkit.name}</p>
                <p className="text-xs text-muted-foreground truncate">{toolkit.description}</p>
              </div>

              {/* Action */}
              {toolkit.isConnected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDisconnect(toolkit)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : toolkit.hasAuthConfig ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleConnect(toolkit)}
                  disabled={connectingToolkit === toolkit.id}
                >
                  {connectingToolkit === toolkit.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground shrink-0">Prêt</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
