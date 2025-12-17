import { z } from "zod";

// ===== TRANSLATION SCHEMAS =====

export const SerializableTranslationExampleSchema = z.object({
	source: z.string(),
	target: z.string(),
});

export const SerializableTranslationSchema = z.object({
	id: z.string(),
	text: z.string(),
	source: z.string(),
	target: z.string(),
	translations: z.array(z.string()),
	examples: z.array(SerializableTranslationExampleSchema).optional(),
	error: z.string().optional(),
});

export type SerializableTranslation = z.infer<typeof SerializableTranslationSchema>;

export const parseSerializableTranslation = (input: unknown): SerializableTranslation => {
	try {
		return SerializableTranslationSchema.parse(input);
	} catch (error) {
		throw new Error(`Invalid translation data: ${error instanceof Error ? error.message : String(error)}`);
	}
};

// ===== SYNONYMS SCHEMAS =====

export const SerializableSynonymItemSchema = z.object({
	id: z.number(),
	synonym: z.string(),
});

export const SerializableSynonymsSchema = z.object({
	id: z.string(),
	text: z.string(),
	source: z.string(),
	synonyms: z.array(SerializableSynonymItemSchema),
	error: z.string().optional(),
});

export type SerializableSynonyms = z.infer<typeof SerializableSynonymsSchema>;

export const parseSerializableSynonyms = (input: unknown): SerializableSynonyms => {
	try {
		return SerializableSynonymsSchema.parse(input);
	} catch (error) {
		throw new Error(`Invalid synonyms data: ${error instanceof Error ? error.message : String(error)}`);
	}
};

// ===== CONJUGATION SCHEMAS =====

export const SerializableVerbFormSchema = z.object({
	id: z.number(),
	conjugation: z.string(),
	verbs: z.array(z.string()),
});

export const SerializableConjugationSchema = z.object({
	id: z.string(),
	infinitive: z.string(),
	verbForms: z.array(SerializableVerbFormSchema),
	error: z.string().optional(),
});

export type SerializableConjugation = z.infer<typeof SerializableConjugationSchema>;

export const parseSerializableConjugation = (input: unknown): SerializableConjugation => {
	try {
		return SerializableConjugationSchema.parse(input);
	} catch (error) {
		throw new Error(`Invalid conjugation data: ${error instanceof Error ? error.message : String(error)}`);
	}
};

// ===== ANTONYMS SCHEMAS =====

export const SerializableAntonymItemSchema = z.object({
	id: z.number(),
	antonym: z.string(),
});

export const SerializableAntonymsSchema = z.object({
	id: z.string(),
	text: z.string(),
	source: z.string(),
	antonyms: z.array(SerializableAntonymItemSchema),
	error: z.string().optional(),
});

export type SerializableAntonyms = z.infer<typeof SerializableAntonymsSchema>;

export const parseSerializableAntonyms = (input: unknown): SerializableAntonyms => {
	try {
		return SerializableAntonymsSchema.parse(input);
	} catch (error) {
		throw new Error(`Invalid antonyms data: ${error instanceof Error ? error.message : String(error)}`);
	}
};
