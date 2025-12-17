export { Translation } from "./translation";
export type { TranslationProps } from "./translation";

export { Synonyms } from "./synonyms";
export type { SynonymsProps } from "./synonyms";

export { Conjugation } from "./conjugation";
export type { ConjugationProps } from "./conjugation";

export { Antonyms } from "./antonyms";
export type { AntonymsProps } from "./antonyms";

export {
	TranslationErrorBoundary,
	SynonymsErrorBoundary,
	ConjugationErrorBoundary,
	AntonymsErrorBoundary,
} from "./error-boundary";

export {
	parseSerializableTranslation,
	parseSerializableSynonyms,
	parseSerializableConjugation,
	parseSerializableAntonyms,
} from "./schema";

export type {
	SerializableTranslation,
	SerializableSynonyms,
	SerializableConjugation,
	SerializableAntonyms,
} from "./schema";

export { getLanguageDisplayName } from "./utils";
