"use client";

import * as React from "react";
import { ToolUIErrorBoundary } from "../shared/error-boundary";

export function TranslationErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ToolUIErrorBoundary componentName="Translation">
			{children}
		</ToolUIErrorBoundary>
	);
}

export function SynonymsErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ToolUIErrorBoundary componentName="Synonyms">
			{children}
		</ToolUIErrorBoundary>
	);
}

export function ConjugationErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ToolUIErrorBoundary componentName="Conjugation">
			{children}
		</ToolUIErrorBoundary>
	);
}

export function AntonymsErrorBoundary({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ToolUIErrorBoundary componentName="Antonyms">
			{children}
		</ToolUIErrorBoundary>
	);
}
