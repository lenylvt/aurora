"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/appwrite/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [snapchatLoading, setSnapchatLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const snapchatAuth = searchParams.get("snapchat_auth");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(
        errorParam === "oauth_failed"
          ? "Échec de l'authentification Snapchat"
          : errorParam === "invalid_state"
          ? "État de sécurité invalide"
          : errorParam === "missing_verifier"
          ? "Code de vérification manquant"
          : errorParam === "user_creation_failed"
          ? "Impossible de créer l'utilisateur"
          : errorParam === "access_denied"
          ? "Accès refusé par Snapchat"
          : "Erreur d'authentification"
      );
    }

    if (snapchatAuth === "success") {
      setSnapchatLoading(true);
      // Auto-login with credentials from Snapchat auth
      fetch("/api/auth/snapchat/login", {
        method: "POST",
        credentials: "include",
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.success && data.email && data.password) {
            // Use client-side Appwrite SDK to create session
            const result = await signIn(data.email, data.password);
            if (result.success) {
              router.push("/chat");
            } else {
              setError("Échec de la création de session");
              setSnapchatLoading(false);
            }
          } else {
            setError("Échec de la connexion automatique");
            setSnapchatLoading(false);
          }
        })
        .catch(() => {
          setError("Échec de la connexion automatique");
          setSnapchatLoading(false);
        });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);

    if (result.success) {
      router.push("/chat");
    } else {
      setError(result.error || "Erreur de connexion");
    }

    setLoading(false);
  };

  const handleSnapchatLogin = () => {
    setSnapchatLoading(true);
    window.location.href = "/api/auth/snapchat";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Aurora</h1>
          <p className="mt-2 text-muted-foreground">
            Ton assistant IA ultra-rapide
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continuer avec
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSnapchatLogin}
            disabled={loading || snapchatLoading}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.206 2.024c.994 0 2.45.497 3.341 1.678.563.745.672 1.636.672 2.227 0 .248-.017.486-.05.714.252.119.554.183.872.183.437 0 .791-.15.962-.27.094-.066.186-.136.271-.209a.689.689 0 0 1 .52-.242c.164 0 .315.065.429.183.127.13.19.302.178.481-.015.205-.105.383-.26.513-.463.386-1.068.598-1.703.598-.168 0-.333-.018-.49-.052-.357 1.831-1.524 3.444-2.948 4.418.047.12.071.249.071.384 0 .39-.241.746-.608.896-.111.045-.227.068-.344.068-.132 0-.262-.028-.385-.083l-.437-.198c-.338-.153-.71-.24-1.084-.252-.359.012-.718.098-1.046.25l-.447.207c-.122.056-.252.084-.384.084-.117 0-.234-.023-.345-.068-.367-.15-.609-.506-.609-.896 0-.135.024-.265.071-.384-1.424-.974-2.591-2.587-2.948-4.418-.157.034-.322.052-.49.052-.635 0-1.24-.212-1.703-.598-.155-.13-.245-.308-.26-.513-.012-.179.051-.351.178-.481.114-.118.265-.183.429-.183.194 0 .374.083.52.242.085.073.177.143.271.209.171.12.525.27.962.27.318 0 .62-.064.872-.183-.033-.228-.05-.466-.05-.714 0-.591.109-1.482.672-2.227.891-1.181 2.347-1.678 3.341-1.678z" />
            </svg>
            {snapchatLoading ? "Connexion..." : "Snapchat"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Pas encore de compte?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Aurora</h1>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
