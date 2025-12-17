"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Languages } from "lucide-react";
import type { SerializableTranslation } from "./schema";

export interface TranslationProps extends SerializableTranslation {
	className?: string;
	isLoading?: boolean;
}

function LoadingSkeleton() {
	return (
		<div className="animate-pulse space-y-3">
			<div className="h-6 bg-muted rounded w-1/3" />
			<div className="h-4 bg-muted rounded w-full" />
			<div className="h-4 bg-muted rounded w-3/4" />
		</div>
	);
}

export function Translation({
	id,
	text,
	source,
	target,
	translations,
	examples,
	error,
	className,
	isLoading,
}: TranslationProps) {
	if (isLoading) {
		return (
			<div className="rounded-xl border bg-card p-4">
				<LoadingSkeleton />
			</div>
		);
	}

	if (error) {
		return (
			<div
				className={cn("rounded-xl border border-destructive/50 bg-destructive/10 p-4", className)}
				data-tool-ui-id={id}
				data-slot="reverso-translation"
			>
				<p className="text-sm text-destructive">Erreur: {error}</p>
			</div>
		);
	}

	return (
		<div
			className={cn("rounded-xl border bg-card overflow-hidden", className)}
			data-tool-ui-id={id}
			data-slot="reverso-translation"
		>
			{/* Header */}
			<div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
				<Languages className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-medium">Traduction</span>
				<div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
					<span className="rounded bg-muted px-2 py-0.5">{source}</span>
					<ArrowRight className="h-3 w-3" />
					<span className="rounded bg-muted px-2 py-0.5">{target}</span>
				</div>
			</div>

			{/* Content */}
			<div className="p-4 space-y-4">
				{/* Original text */}
				<div>
					<p className="text-sm text-muted-foreground mb-1">Texte original</p>
					<p className="text-base font-medium">{text}</p>
				</div>

				{/* Translations */}
				{translations && translations.length > 0 && (
					<div>
						<p className="text-sm text-muted-foreground mb-2">Traductions</p>
						<div className="flex flex-wrap gap-2">
							{translations.slice(0, 5).map((translation, i) => (
								<span
									key={i}
									className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium"
								>
									{translation}
								</span>
							))}
						</div>
					</div>
				)}

				{/* Examples */}
				{examples && examples.length > 0 && (
					<div>
						<p className="text-sm text-muted-foreground mb-2">Exemples de contexte</p>
						<div className="space-y-3">
							{examples.map((example, i) => (
								<div key={i} className="rounded-lg bg-muted/30 p-3 space-y-1.5">
									<p className="text-sm">{example.source}</p>
									<div className="flex items-center gap-2">
										<ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
										<p className="text-sm text-muted-foreground">{example.target}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
