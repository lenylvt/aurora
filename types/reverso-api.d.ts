declare module "reverso-api" {
	class Reverso {
		constructor();

		getContext(
			text: string,
			sourceLang: string,
			targetLang: string,
			callback: (error: Error | null, response: any) => void,
		): void;

		getSynonyms(
			text: string,
			lang: string,
			callback: (error: Error | null, response: any) => void,
		): void;

		getConjugation(
			verb: string,
			lang: string,
			callback: (error: Error | null, response: any) => void,
		): void;

		getTranslation(
			text: string,
			sourceLang: string,
			targetLang: string,
			callback: (error: Error | null, response: any) => void,
		): void;

		getSpellCheck(
			text: string,
			lang: string,
			callback: (error: Error | null, response: any) => void,
		): void;
	}

	export = Reverso;
}
