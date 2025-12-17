"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SwitchCamera } from "lucide-react";
import type { SerializableAntonyms } from "./schema";
import { getLanguageDisplayName } from "./utils";

export interface AntonymsProps extends SerializableAntonyms {
	className?: string;
	isLoading?: boolean;
}

function LoadingSkeleton() {
	return (
		<div className="animate-pulse space-y-3">
			<div className="h-6 bg-muted rounded w-1/3" />
			<div className="flex flex-wrap gap-2">
				<div className="h-8 bg-muted rounded-full w-20" />
				<div className="h-8 bg-muted rounded-full w-24" />
				<div className="h-8 bg-muted rounded-full w-16" />
				<div className="h-8 bg-muted rounded-full w-28" />
			</div>
		</div>
	);
}

export function Antonyms({
	id,
	text,
	source,
	antonyms,
	error,
	className,
	isLoading,
}: AntonymsProps) {
	const [showAll, setShowAll] = React.useState(false);
	const displayedAntonyms = showAll ? antonyms : antonyms?.slice(0, 10);

	// Handle loading or incomplete streaming data
	if (isLoading || !text || !source || !antonyms) {
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
				data-slot="reverso-antonyms"
			>
				<p className="text-sm text-destructive">Erreur: {error}</p>
			</div>
		);
	}

	return (
		<div
			className={cn("rounded-xl border bg-card overflow-hidden", className)}
			data-tool-ui-id={id}
			data-slot="reverso-antonyms"
		>
			{/* Header */}
			<div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
				<SwitchCamera className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-medium">Antonymes</span>
				<span className="ml-auto text-xs text-muted-foreground rounded bg-muted px-2 py-0.5">
					{getLanguageDisplayName(source)}
				</span>
			</div>

			{/* Content */}
			<div className="p-4 space-y-4">
				{/* Original word */}
				<div>
					<p className="text-sm text-muted-foreground mb-1">Mot</p>
					<p className="text-lg font-semibold">{text}</p>
				</div>

				{/* Antonyms list */}
				{antonyms && antonyms.length > 0 ? (
					<div>
						<p className="text-sm text-muted-foreground mb-3">
							{antonyms.length} antonyme{antonyms.length > 1 ? "s" : ""} trouvé{antonyms.length > 1 ? "s" : ""}
						</p>
						<div className="flex flex-wrap gap-2">
							{displayedAntonyms?.map((item) => (
								<span
									key={item.id}
									className="inline-flex items-center rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-medium hover:bg-destructive/20 transition-colors"
								>
									{item.antonym}
								</span>
							))}
						</div>
						{antonyms.length > 10 && !showAll && (
							<button
								onClick={() => setShowAll(true)}
								className="mt-3 text-sm text-primary hover:underline font-medium"
							>
								Afficher plus ({antonyms.length - 10} de plus)
							</button>
						)}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">Aucun antonyme trouvé</p>
				)}
			</div>
		</div>
	);
}
