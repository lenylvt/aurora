"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Loader2, Plus, Trash2, CheckCircle2, Circle, Sparkles } from "lucide-react";

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
      <div className="flex h-full min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8 space-y-8">
      {/* Header style chat welcome */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Connexions</h2>
        <p className="text-muted-foreground">Services connectés à Aurora</p>
      </div>

      {toolkits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Aucun service disponible</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Les intégrations seront bientôt disponibles
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {toolkits.map((toolkit, index) => (
            <div
              key={toolkit.id}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-all duration-200 fade-in animate-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status indicator avec cercle */}
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${toolkit.isConnected
                  ? "bg-green-500/10"
                  : "bg-background"
                }`}>
                {toolkit.isConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : toolkit.hasAuthConfig ? (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{toolkit.name}</p>
                <p className="text-sm text-muted-foreground truncate">{toolkit.description}</p>
              </div>

              {/* Action button */}
              {toolkit.isConnected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDisconnect(toolkit)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : toolkit.hasAuthConfig ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full h-9 px-4"
                  onClick={() => handleConnect(toolkit)}
                  disabled={connectingToolkit === toolkit.id}
                >
                  {connectingToolkit === toolkit.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Connecter
                    </>
                  )}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Prêt
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
