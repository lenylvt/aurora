"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { account } from "@/lib/appwrite/client";
import { Loader2, User, Calendar, KeyRound, Trash2, Link2 } from "lucide-react";

interface UserData {
  name: string;
  email: string;
  emailVerification: boolean;
  registration: string;
}

export default function ProfileTab() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await account.get();
      setUserData({
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        registration: user.registration,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Échec du chargement des données utilisateur");
    } finally {
      setLoading(false);
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

  if (!userData) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center">
        <p className="text-muted-foreground">Impossible de charger les données</p>
      </div>
    );
  }

  const isSnapchatAccount = userData.email.startsWith("snapchat");

  return (
    <div className="mx-auto max-w-lg px-6 py-8 space-y-8">
      {/* Header style chat welcome */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Profil</h2>
        <p className="text-muted-foreground">Vos informations de compte</p>
      </div>

      {/* Info cards avec design moderne */}
      <div className="space-y-3">
        <div className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">Nom</p>
            <p className="font-semibold truncate">{userData.name}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">Connexion avec</p>
            <p className="font-semibold truncate">{isSnapchatAccount ? "Snapchat" : userData.email}</p>
          </div>
        </div>

        <div className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">Membre depuis</p>
            <p className="font-semibold">
              {new Date(userData.registration).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Actions avec buttons arrondis */}
      <div className="space-y-2 pt-4 border-t">
        {!isSnapchatAccount && (
          <Button
            variant="outline"
            className="w-full justify-start h-12 rounded-xl"
            onClick={() => toast.info("Fonctionnalité à venir")}
          >
            <KeyRound className="h-4 w-4 mr-3" />
            Modifier le mot de passe
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => toast.info("Fonctionnalité à venir")}
        >
          <Trash2 className="h-4 w-4 mr-3" />
          Supprimer le compte
        </Button>
      </div>
    </div>
  );
}
