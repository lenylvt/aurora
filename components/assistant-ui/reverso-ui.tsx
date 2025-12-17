"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import {
	Translation,
	Synonyms,
	Conjugation,
	Antonyms,
	TranslationErrorBoundary,
	SynonymsErrorBoundary,
	ConjugationErrorBoundary,
	AntonymsErrorBoundary,
	parseSerializableTranslation,
	parseSerializableSynonyms,
	parseSerializableConjugation,
	parseSerializableAntonyms,
} from "@/components/tool-ui/reverso";

/**
 * Tool UI for `afficher_traduction` tool.
 */
export const TraduireUI = makeAssistantToolUI({
	toolName: "afficher_traduction",
	render: ({ args }) => {
		// Parse args with fallback
		const parseArgs = (input: unknown) => {
			if (!input || typeof input !== "object") return null;
			const obj = input as Record<string, unknown>;

			// Check if required fields are present
			if (!obj.text || !obj.source || !obj.target || !obj.translations) {
				return null;
			}

			return {
				id: `translation-${Date.now()}`,
				text: obj.text as string,
				source: obj.source as string,
				target: obj.target as string,
				translations: obj.translations as string[],
				examples: obj.examples as Array<{ source: string; target: string }> | undefined,
			};
		};

		const translationData = parseArgs(args);

		// Show loading skeleton while streaming
		if (!translationData) {
			return (
				<div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs animate-pulse">
					<div className="h-4 bg-muted rounded w-1/3 mb-4" />
					<div className="h-20 bg-muted rounded-lg" />
				</div>
			);
		}

		try {
			const translation = parseSerializableTranslation(translationData);
			return (
				<TranslationErrorBoundary>
					<Translation {...translation} />
				</TranslationErrorBoundary>
			);
		} catch (error) {
			console.error("[TraduireUI] Failed to parse args:", error);
			// If parsing fails, show the data anyway (streaming partial data)
			return (
				<TranslationErrorBoundary>
					<Translation {...translationData} />
				</TranslationErrorBoundary>
			);
		}
	},
});

/**
 * Tool UI for `afficher_synonymes` tool.
 * Handles both API mode (result) and AI mode (args)
 */
export const SynonymesUI = makeAssistantToolUI({
	toolName: "afficher_synonymes",
	render: ({ args, result }) => {
		// Parse result (from API) or args (from AI)
		const parseData = (input: unknown, isResult: boolean) => {
			if (!input || typeof input !== "object") return null;
			const obj = input as Record<string, unknown>;

			// Check if required fields are present
			const text = obj.text as string;
			const source = isResult ? (obj.source as string) : (obj.language as string);
			const synonyms = obj.synonyms as Array<{ id: number; synonym: string }>;

			if (!text || !source) {
				return null;
			}

			return {
				id: `synonyms-${Date.now()}`,
				text,
				source,
				synonyms: synonyms || [],
			};
		};

		// Try result first (API mode), then args (AI mode)
		const synonymsData = result !== undefined
			? parseData(result, true)
			: parseData(args, false);

		// Show loading skeleton while streaming
		if (!synonymsData) {
			return (
				<div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs animate-pulse">
					<div className="h-4 bg-muted rounded w-1/3 mb-4" />
					<div className="flex flex-wrap gap-2">
						<div className="h-8 bg-muted rounded-full w-20" />
						<div className="h-8 bg-muted rounded-full w-24" />
						<div className="h-8 bg-muted rounded-full w-16" />
					</div>
				</div>
			);
		}

		try {
			const synonyms = parseSerializableSynonyms(synonymsData);
			return (
				<SynonymsErrorBoundary>
					<Synonyms {...synonyms} />
				</SynonymsErrorBoundary>
			);
		} catch (error) {
			console.error("[SynonymesUI] Failed to parse data:", error);
			// If parsing fails, show the data anyway (streaming partial data)
			return (
				<SynonymsErrorBoundary>
					<Synonyms {...synonymsData} />
				</SynonymsErrorBoundary>
			);
		}
	},
});

/**
 * Tool UI for `afficher_conjugaison` tool.
 */
export const ConjugaisonUI = makeAssistantToolUI({
	toolName: "afficher_conjugaison",
	render: ({ args }) => {
		// Parse args with fallback
		const parseArgs = (input: unknown) => {
			if (!input || typeof input !== "object") return null;
			const obj = input as Record<string, unknown>;

			// Check if required fields are present (streaming may be incomplete)
			if (!obj.infinitive || !obj.verbForms) {
				return null;
			}

			return {
				id: `conjugation-${Date.now()}`,
				infinitive: obj.infinitive as string,
				verbForms: obj.verbForms as Array<{ id: number; conjugation: string; verbs: string[] }>,
			};
		};

		const conjugationData = parseArgs(args);

		// Show loading skeleton while streaming
		if (!conjugationData) {
			return (
				<div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs animate-pulse">
					<div className="h-4 bg-muted rounded w-1/3 mb-4" />
					<div className="space-y-2">
						<div className="h-10 bg-muted rounded-lg" />
						<div className="h-10 bg-muted rounded-lg" />
						<div className="h-10 bg-muted rounded-lg" />
					</div>
				</div>
			);
		}

		try {
			const conjugation = parseSerializableConjugation(conjugationData);
			return (
				<ConjugationErrorBoundary>
					<Conjugation {...conjugation} />
				</ConjugationErrorBoundary>
			);
		} catch (error) {
			console.error("[ConjugaisonUI] Failed to parse args:", error);
			// If parsing fails, show the data anyway (streaming partial data)
			return (
				<ConjugationErrorBoundary>
					<Conjugation {...conjugationData} />
				</ConjugationErrorBoundary>
			);
		}
	},
});

/**
 * Tool UI for `afficher_antonymes` tool.
 * Handles both API mode (result) and AI mode (args)
 */
export const AntonymesUI = makeAssistantToolUI({
	toolName: "afficher_antonymes",
	render: ({ args, result }) => {
		// Parse result (from API) or args (from AI)
		const parseData = (input: unknown, isResult: boolean) => {
			if (!input || typeof input !== "object") return null;
			const obj = input as Record<string, unknown>;

			// Check if required fields are present
			const text = obj.text as string;
			const source = isResult ? (obj.source as string) : (obj.language as string);
			const antonyms = obj.antonyms as Array<{ id: number; antonym: string }>;

			if (!text || !source) {
				return null;
			}

			return {
				id: `antonyms-${Date.now()}`,
				text,
				source,
				antonyms: antonyms || [],
			};
		};

		// Try result first (API mode), then args (AI mode)
		const antonymsData = result !== undefined
			? parseData(result, true)
			: parseData(args, false);

		// Show loading skeleton while streaming
		if (!antonymsData) {
			return (
				<div className="bg-card/60 text-muted-foreground w-full max-w-xl rounded-2xl border px-5 py-4 text-sm shadow-xs animate-pulse">
					<div className="h-4 bg-muted rounded w-1/3 mb-4" />
					<div className="flex flex-wrap gap-2">
						<div className="h-8 bg-muted rounded-full w-20" />
						<div className="h-8 bg-muted rounded-full w-24" />
						<div className="h-8 bg-muted rounded-full w-16" />
					</div>
				</div>
			);
		}

		try {
			const antonyms = parseSerializableAntonyms(antonymsData);
			return (
				<AntonymsErrorBoundary>
					<Antonyms {...antonyms} />
				</AntonymsErrorBoundary>
			);
		} catch (error) {
			console.error("[AntonymesUI] Failed to parse data:", error);
			// If parsing fails, show the data anyway (streaming partial data)
			return (
				<AntonymsErrorBoundary>
					<Antonyms {...antonymsData} />
				</AntonymsErrorBoundary>
			);
		}
	},
});
