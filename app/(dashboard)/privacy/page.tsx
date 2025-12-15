import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Aurora",
  description: "Politique de confidentialité et protection des données d'Aurora",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="h-screen overflow-y-auto">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            <strong>Date d'entrée en vigueur :</strong> 15 décembre 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
            <p>
              Bienvenue sur Aurora, un assistant IA conçu pour les étudiants. Cette politique de confidentialité
              explique comment nous collectons, utilisons et protégeons vos données personnelles lorsque vous
              utilisez notre application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">2. Données collectées</h2>

            <h3 className="text-xl font-semibold mt-6">2.1 Informations d'authentification</h3>
            <p>Lorsque vous créez un compte ou vous connectez via Snapchat, nous collectons :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nom d'utilisateur</li>
              <li>Adresse e-mail</li>
              <li>Photo de profil (si disponible via Snapchat)</li>
              <li>Identifiant unique Snapchat (si connexion via Snapchat)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">2.2 Données d'utilisation</h3>
            <p>Nous collectons les informations suivantes lors de votre utilisation d'Aurora :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Historique des conversations avec l'assistant IA</li>
              <li>Fichiers et documents que vous partagez avec l'assistant</li>
              <li>Préférences de thème et paramètres de l'application</li>
              <li>Connexions aux outils externes (via Composio)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">2.3 Données techniques</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Adresse IP</li>
              <li>Type de navigateur et système d'exploitation</li>
              <li>Données de session et cookies</li>
              <li>Logs d'erreurs et de performance</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">3. Utilisation des données</h2>
            <p>Nous utilisons vos données personnelles pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fournir et améliorer nos services d'assistant IA</li>
              <li>Personnaliser votre expérience utilisateur</li>
              <li>Authentifier et sécuriser votre compte</li>
              <li>Analyser l'utilisation de l'application pour optimiser les performances</li>
              <li>Communiquer avec vous concernant les mises à jour et le support</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">4. Intégration Snapchat</h2>
            <p>
              Aurora utilise Snapchat Login Kit uniquement pour l'authentification. Nous ne publions jamais
              de contenu sur votre compte Snapchat et ne collectons aucune donnée Snapchat au-delà de ce qui
              est nécessaire pour l'authentification (nom, email, photo de profil).
            </p>
            <p>
              <strong>Important :</strong> Aurora ne génère pas de contenu pour Snapchat et ne partage aucune
              donnée avec Snapchat au-delà du processus d'authentification initial.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">5. Partage des données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Nous partageons vos données uniquement avec :</p>

            <h3 className="text-xl font-semibold mt-6">5.1 Fournisseurs de services</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Appwrite</strong> : Hébergement de la base de données et authentification</li>
              <li><strong>Groq</strong> : Traitement des requêtes IA (les conversations sont envoyées à l'API Groq)</li>
              <li><strong>Composio</strong> : Intégrations avec des outils externes (uniquement si vous les activez)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">5.2 Obligations légales</h3>
            <p>
              Nous pouvons divulguer vos données si la loi l'exige ou pour protéger nos droits légaux.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">6. Sécurité des données</h2>
            <p>Nous mettons en œuvre des mesures de sécurité pour protéger vos données :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Authentification sécurisée avec JWT</li>
              <li>Contrôle d'accès basé sur les rôles</li>
              <li>Hébergement sécurisé sur des serveurs certifiés</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">7. Conservation des données</h2>
            <p>
              Nous conservons vos données tant que votre compte est actif. Si vous supprimez votre compte,
              vos données personnelles seront supprimées dans un délai de 30 jours, sauf si nous sommes
              légalement tenus de les conserver plus longtemps.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">8. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à l'adresse indiquée ci-dessous.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">9. Cookies</h2>
            <p>Aurora utilise des cookies essentiels pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintenir votre session utilisateur</li>
              <li>Mémoriser vos préférences (thème, langue)</li>
              <li>Assurer la sécurité de l'application</li>
            </ul>
            <p>
              Nous n'utilisons pas de cookies publicitaires ou de suivi tiers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">10. Utilisateurs mineurs</h2>
            <p>
              Aurora est destiné aux étudiants du lycée et plus. Si vous avez moins de 16 ans, vous devez
              obtenir le consentement de vos parents ou tuteurs légaux avant d'utiliser Aurora.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">11. Modifications de cette politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Nous vous
              informerons de tout changement important par e-mail ou via une notification dans l'application.
              La date de "dernière mise à jour" en haut de cette page indique quand cette politique a été
              révisée pour la dernière fois.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">12. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
              contactez-nous :
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p><strong>Email :</strong> lenylvt@icloud.com</p>
            </div>
          </section>

          <section className="space-y-4 mt-8 pt-8 border-t">
            <h2 className="text-2xl font-semibold">13. Base légale (RGPD)</h2>
            <p>
              Le traitement de vos données personnelles est basé sur :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Exécution du contrat :</strong> Fournir les services Aurora que vous avez demandés</li>
              <li><strong>Intérêt légitime :</strong> Améliorer nos services et assurer la sécurité</li>
              <li><strong>Consentement :</strong> Pour les intégrations optionnelles avec des outils externes</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
