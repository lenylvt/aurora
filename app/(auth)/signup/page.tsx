"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp, getCurrentUser } from "@/lib/appwrite/client";
import { StarLogo } from "@/components/ui/star-logo";

function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snapchatLoading, setSnapchatLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Utilisateur déjà connecté, rediriger vers /chat
          router.replace("/home");
          return;
        }
      } catch (error) {
        // Pas de session active, c'est normal
      }
      setCheckingAuth(false);
    };
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp(email, password, name);

    if (result.success) {
      router.push("/home");
    } else {
      setError(result.error || "Erreur d'inscription");
    }

    setLoading(false);
  };

  const handleSnapchatLogin = () => {
    setSnapchatLoading(true);
    window.location.href = "/api/auth/snapchat";
  };

  // Afficher un loader pendant la vérification de session
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center space-y-4">
          <StarLogo size={64} className="text-foreground animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight">Aurora</h1>
          <p className="text-muted-foreground">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo et titre */}
        <div className="flex flex-col items-center space-y-4">
          <StarLogo size={64} className="text-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">Aurora</h1>
        </div>

        {/* Formulaire d'inscription */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="name"
                type="text"
                placeholder="Nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
                className="h-12 rounded-xl"
              />
              <p className="text-xs text-muted-foreground px-1">
                Minimum 8 caractères
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium"
              disabled={loading}
            >
              {loading ? "Inscription..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl text-base font-medium border-2"
            style={{
              backgroundColor: '#FFFC00',
              borderColor: '#FFFC00',
              color: '#000000'
            }}
            onClick={handleSnapchatLogin}
            disabled={loading || snapchatLoading}
          >
            <svg
              className="mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
            >
              <path d="M256 48C280 160 352 232 464 256C352 280 280 352 256 464C232 352 160 280 48 256C160 232 232 160 256 48Z" />
            </svg>
            {snapchatLoading ? "Connexion..." : "Continuer avec Snapchat"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium hover:underline"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center space-y-4">
          <StarLogo size={64} className="text-foreground animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight">Aurora</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
