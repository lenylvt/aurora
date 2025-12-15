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
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Impossible de charger les données</p>
      </div>
    );
  }

  const isSnapchatAccount = userData.email.startsWith("snapchat");

  return (
    <div className="h-full p-6 sm:p-8 space-y-6 overflow-auto">
      <div>
        <h2 className="text-xl font-semibold">Profil</h2>
        <p className="text-sm text-muted-foreground">Vos informations de compte</p>
      </div>

      {/* Informations utilisateur */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <User className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Nom</p>
            <p className="font-medium truncate">{userData.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Connexion avec</p>
            <p className="font-medium truncate">{isSnapchatAccount ? "Snapchat" : userData.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Membre depuis</p>
            <p className="font-medium">
              {new Date(userData.registration).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-2">
        {!isSnapchatAccount && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => toast.info("Fonctionnalité à venir")}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Modifier le mot de passe
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => toast.info("Fonctionnalité à venir")}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer le compte
        </Button>
      </div>
    </div>
  );
}
