"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSessionJWT } from "@/lib/appwrite/client";
import { Loader2, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";

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
      toast.error(`Aucun Auth Config ID pour ${toolkit.name}. Ajoutez-le dans composio.config.json`);
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
      toast.error("Échec de la connexion à " + toolkit.name);
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Connexions d'outils</h2>
        <p className="text-muted-foreground mt-1">
          Connectez des services externes pour améliorer les capacités de votre assistant IA
        </p>
      </div>

      {toolkits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Aucun outil configuré. Ajoutez des outils dans <code className="bg-muted px-1 rounded">composio.config.json</code>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {toolkits.map((toolkit) => (
            <Card key={toolkit.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {toolkit.name}
                      {toolkit.isConnected ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connecté
                        </Badge>
                      ) : !toolkit.hasAuthConfig ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Prêt
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Non connecté
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {toolkit.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  {toolkit.allowedTools && toolkit.allowedTools.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Outils spécifiques:</p>
                      <div className="flex flex-wrap gap-1">
                        {toolkit.allowedTools.slice(0, 3).map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool.split("_").slice(1).join(" ").toLowerCase()}
                          </Badge>
                        ))}
                        {toolkit.allowedTools.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{toolkit.allowedTools.length - 3} plus
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    {toolkit.isConnected ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDisconnect(toolkit)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Déconnecter
                      </Button>
                    ) : toolkit.hasAuthConfig ? (
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(toolkit)}
                        disabled={connectingToolkit === toolkit.id}
                      >
                        {connectingToolkit === toolkit.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connexion...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Connecter
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full" disabled>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aucune auth requise
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
