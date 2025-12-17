import { z } from "zod";
import { parseWithSchema } from "../shared/parse";

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
	return parseWithSchema(SerializableTranslationSchema, input, "translation");
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
	return parseWithSchema(SerializableSynonymsSchema, input, "synonyms");
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
	return parseWithSchema(SerializableConjugationSchema, input, "conjugation");
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
	return parseWithSchema(SerializableAntonymsSchema, input, "antonyms");
};
