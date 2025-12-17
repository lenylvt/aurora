/**
 * Specialty configuration
 * Each specialty defines a custom prompt and preferred tools
 */

export interface SpecialtyConfig {
    id: string;
    name: string;
    icon: string;
    description: string;
    prompt: string;
    preferredTools: string[];
}

export const SPECIALTIES: Record<string, SpecialtyConfig> = {
    langue: {
        id: "langue",
        name: "Langue",
        icon: "Globe",
        description: "Focus sur conjugaison, synonymes, antonymes",
        prompt: `
=== MODE SPÉCIALITÉ LANGUE ACTIVÉ ===

Tu es maintenant en mode LANGUE. Pour CHAQUE message utilisateur, tu DOIS:

1. ANALYSER le message pour identifier:
   - Verbes → utiliser afficher_conjugaison
   - Mots nécessitant définition/vocabulaire → utiliser afficher_synonymes
   - Demandes de contraires/opposés → utiliser afficher_antonymes
   - Texte en langue étrangère → utiliser afficher_traduction

2. UTILISATION PROACTIVE ET SYSTÉMATIQUE:
   - Si UN SEUL outil est pertinent: l'appeler directement
   - Si PLUSIEURS outils sont pertinents: utiliser show_options pour laisser l'utilisateur choisir
   - Ne PAS attendre que l'utilisateur demande explicitement
   - Être proactif: même si la demande est indirecte, proposer les outils de langue

3. EXEMPLES DE DÉCLENCHEMENT:
   - "rapide" → afficher_synonymes (français) OU show_options si antonymes aussi pertinent
   - "manger" → afficher_conjugaison directement
   - "happy" → afficher_traduction + afficher_synonymes via show_options
   - "grand" → show_options avec [synonymes, antonymes]
   - "je cours" → afficher_conjugaison pour "courir"

4. RÈGLE CRITIQUE:
   - En mode LANGUE, privilégier TOUJOURS les outils visuels
   - Ne JAMAIS donner une réponse textuelle simple si un outil peut être utilisé
   - Si hésitation entre texte et outil: TOUJOURS choisir l'outil

Ce mode reste actif jusqu'à désactivation explicite.
`,
        preferredTools: [
            "afficher_conjugaison",
            "afficher_synonymes",
            "afficher_antonymes",
            "afficher_traduction",
            "show_options",
        ],
    },
};

export function getSpecialtyById(id: string): SpecialtyConfig | undefined {
    return SPECIALTIES[id];
}

export function getAllSpecialties(): SpecialtyConfig[] {
    return Object.values(SPECIALTIES);
}
