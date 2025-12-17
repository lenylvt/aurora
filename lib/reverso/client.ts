import Reverso from "reverso-api";
import * as cheerio from "cheerio";

/**
 * Map language codes (fr, en, es, etc.) to Reverso API language names
 */
const LANGUAGE_MAP: Record<string, string> = {
	fr: "french",
	en: "english",
	es: "spanish",
	de: "german",
	it: "italian",
	pt: "portuguese",
	ru: "russian",
	pl: "polish",
	nl: "dutch",
	ar: "arabic",
	he: "hebrew",
	zh: "chinese",
	ja: "japanese",
	tr: "turkish",
	ro: "romanian",
};

/**
 * Normalize language code to Reverso API format
 */
function normalizeLanguage(lang: string): string {
	const normalized = lang.toLowerCase();
	return LANGUAGE_MAP[normalized] || normalized;
}

/**
 * Check if Reverso is available (always true, no API key required)
 */
export function isReversoAvailable(): boolean {
	return true;
}

/**
 * Get translation from Reverso
 */
export async function getTranslation(
	text: string,
	sourceLang: string,
	targetLang: string,
): Promise<{
	ok: boolean;
	text?: string;
	source?: string;
	target?: string;
	translations?: string[];
	examples?: Array<{ source: string; target: string }>;
	message?: string;
}> {
	const reverso = new Reverso();
	const source = normalizeLanguage(sourceLang);
	const target = normalizeLanguage(targetLang);

	return new Promise((resolve) => {
		reverso.getContext(text, source, target, (err: Error | null, response: any) => {
			if (err) {
				resolve({
					ok: false,
					message: err.message || "Erreur de traduction",
				});
			} else {
				resolve({
					ok: true,
					text: response.text,
					source: response.source,
					target: response.target,
					translations: response.translations,
					examples: response.examples?.slice(0, 5).map((ex: any) => ({
						source: ex.source,
						target: ex.target,
					})),
				});
			}
		});
	});
}

/**
 * Get synonyms from synonymo.fr (French) or Datamuse API (English)
 */
export async function getSynonyms(
	text: string,
	lang: string,
): Promise<{
	ok: boolean;
	text?: string;
	source?: string;
	synonyms?: Array<{ id: number; synonym: string }>;
	message?: string;
}> {
	try {
		const normalizedLang = lang.toLowerCase();

		// French - use synonymo.fr
		if (normalizedLang === "fr" || normalizedLang === "french") {
			const url = `https://www.synonymo.fr/synonyme/${encodeURIComponent(text)}`;
			const response = await fetch(url);

			if (!response.ok) {
				return {
					ok: false,
					message: `Erreur HTTP: ${response.status}`,
				};
			}

			const html = await response.text();
			const $ = cheerio.load(html);

			const synonyms: Array<{ id: number; synonym: string }> = [];
			$("ul.synos li a.word").each((index, element) => {
				const synonym = $(element).text().trim();
				if (synonym) {
					synonyms.push({ id: index, synonym });
				}
			});

			return {
				ok: true,
				text,
				source: "french",
				synonyms,
			};
		}

		// English - use Datamuse API
		if (normalizedLang === "en" || normalizedLang === "english") {
			const url = `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(text)}&max=30`;
			const response = await fetch(url);

			if (!response.ok) {
				return {
					ok: false,
					message: `HTTP Error: ${response.status}`,
				};
			}

			const data = await response.json();
			const synonyms = data.map((item: any, index: number) => ({
				id: index,
				synonym: item.word,
			}));

			return {
				ok: true,
				text,
				source: "english",
				synonyms,
			};
		}

		// Other languages not supported
		return {
			ok: false,
			message: `Langue non supportée pour les synonymes. Langues disponibles: français (fr), anglais (en)`,
		};
	} catch (error: any) {
		return {
			ok: false,
			message: error.message || "Erreur de récupération des synonymes",
		};
	}
}

/**
 * Get verb conjugation from Reverso
 */
export async function getConjugation(
	verb: string,
	lang: string,
): Promise<{
	ok: boolean;
	infinitive?: string;
	verbForms?: Array<{
		id: number;
		conjugation: string;
		verbs: string[];
	}>;
	message?: string;
}> {
	const reverso = new Reverso();
	const language = normalizeLanguage(lang);

	return new Promise((resolve) => {
		reverso.getConjugation(verb, language, (err: Error | null, response: any) => {
			if (err) {
				resolve({
					ok: false,
					message: err.message || "Erreur de conjugaison",
				});
			} else {
				resolve({
					ok: true,
					infinitive: response.infinitive,
					verbForms: response.verbForms,
				});
			}
		});
	});
}

/**
 * Get antonyms from antonyme.org (French) or Datamuse API (English)
 */
export async function getAntonyms(
	text: string,
	lang: string,
): Promise<{
	ok: boolean;
	text?: string;
	source?: string;
	antonyms?: Array<{ id: number; antonym: string }>;
	message?: string;
}> {
	try {
		const normalizedLang = lang.toLowerCase();

		// French - use antonyme.org
		if (normalizedLang === "fr" || normalizedLang === "french") {
			const url = `https://www.antonyme.org/antonyme/${encodeURIComponent(text)}`;
			const response = await fetch(url);

			if (!response.ok) {
				return {
					ok: false,
					message: `Erreur HTTP: ${response.status}`,
				};
			}

			const html = await response.text();
			const $ = cheerio.load(html);

			const antonyms: Array<{ id: number; antonym: string }> = [];
			$("ul.synos li a.word").each((index, element) => {
				const antonym = $(element).text().trim();
				if (antonym) {
					antonyms.push({ id: index, antonym });
				}
			});

			return {
				ok: true,
				text,
				source: "french",
				antonyms,
			};
		}

		// English - use Datamuse API
		if (normalizedLang === "en" || normalizedLang === "english") {
			const url = `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(text)}&max=30`;
			const response = await fetch(url);

			if (!response.ok) {
				return {
					ok: false,
					message: `HTTP Error: ${response.status}`,
				};
			}

			const data = await response.json();
			const antonyms = data.map((item: any, index: number) => ({
				id: index,
				antonym: item.word,
			}));

			return {
				ok: true,
				text,
				source: "english",
				antonyms,
			};
		}

		// Other languages not supported
		return {
			ok: false,
			message: `Langue non supportée pour les antonymes. Langues disponibles: français (fr), anglais (en)`,
		};
	} catch (error: any) {
		return {
			ok: false,
			message: error.message || "Erreur de récupération des antonymes",
		};
	}
}
