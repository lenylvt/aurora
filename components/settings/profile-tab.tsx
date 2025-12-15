"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { account } from "@/lib/appwrite/client";
import { Loader2, User, Mail, Calendar } from "lucide-react";

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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Impossible de charger les données utilisateur</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Profil</h2>
        <p className="text-muted-foreground mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Vos informations de compte Aurora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={userData.name}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                disabled
                className="bg-muted"
              />
              {!userData.emailVerification && (
                <p className="text-sm text-muted-foreground">
                  Email non vérifié
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membre depuis
              </Label>
              <Input
                value={new Date(userData.registration).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions du compte</CardTitle>
            <CardDescription>
              Gérez votre compte Aurora
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.info("Fonctionnalité à venir")}
            >
              Modifier le mot de passe
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => toast.info("Fonctionnalité à venir")}
            >
              Supprimer le compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
