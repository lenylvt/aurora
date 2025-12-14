"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Sparkles, Loader2, X } from "lucide-react";
import Link from "next/link";

interface Toolkit {
  id: string;
  name: string;
  toolkit: string;
  description: string;
  requiresAuth: boolean;
  isConnected: boolean;
  allowedTools: string[];
}

interface MCPSuggestionProps {
  onDismiss?: () => void;
}

export function MCPSuggestion({ onDismiss }: MCPSuggestionProps) {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchToolkits();
  }, []);

  const fetchToolkits = async () => {
    try {
      const response = await fetch("/api/composio/toolkits");
      const data = await response.json();
      setToolkits(data.toolkits || []);
    } catch (error) {
      console.error("Error fetching toolkits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (loading || dismissed) {
    return null;
  }

  const connectedToolkits = toolkits.filter((t) => t.isConnected);
  const disconnectedToolkits = toolkits.filter(
    (t) => !t.isConnected && t.requiresAuth
  );

  // Don't show if all toolkits are connected or no toolkits available
  if (disconnectedToolkits.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      <Sparkles className="h-4 w-4" />
      <AlertTitle>Améliorez votre assistant avec des connexions MCP</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          {connectedToolkits.length > 0 && (
            <div>
              <p className="text-sm mb-2">
                <strong>Connecté ({connectedToolkits.length}):</strong>
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {connectedToolkits.map((toolkit) => (
                  <Badge key={toolkit.id} variant="default" className="text-xs">
                    {toolkit.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {disconnectedToolkits.length > 0 && (
            <div>
              <p className="text-sm mb-2">
                <strong>
                  Disponibles ({disconnectedToolkits.length}):
                </strong>
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {disconnectedToolkits.slice(0, 4).map((toolkit) => (
                  <Badge
                    key={toolkit.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {toolkit.name}
                  </Badge>
                ))}
                {disconnectedToolkits.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{disconnectedToolkits.length - 4} autres
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Link href="/connections">
            <Button size="sm" className="mt-2">
              <ExternalLink className="mr-2 h-4 w-4" />
              Gérer les connexions
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function MCPToolkitsList() {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToolkits();
  }, []);

  const fetchToolkits = async () => {
    try {
      const response = await fetch("/api/composio/toolkits");
      const data = await response.json();
      setToolkits(data.toolkits || []);
    } catch (error) {
      console.error("Error fetching toolkits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const connectedToolkits = toolkits.filter((t) => t.isConnected);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Outils disponibles</h3>
        <Link href="/connections">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {connectedToolkits.length > 0 ? (
        <div className="space-y-1">
          {connectedToolkits.map((toolkit) => (
            <div
              key={toolkit.id}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{toolkit.name}</p>
                <p className="text-xs text-muted-foreground">
                  {toolkit.allowedTools.length > 0
                    ? `${toolkit.allowedTools.length} outils`
                    : "Tous les outils"}
                </p>
              </div>
              <Badge variant="default" className="text-xs">
                Actif
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Aucun outil connecté
          </p>
          <Link href="/connections">
            <Button size="sm" variant="outline">
              Connecter des outils
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
