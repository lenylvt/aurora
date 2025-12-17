"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import * as Collapsible from "@radix-ui/react-collapsible";
import { BookOpen, ChevronDown } from "lucide-react";
import type { SerializableConjugation } from "./schema";

export interface ConjugationProps extends SerializableConjugation {
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

export function Conjugation({
	id,
	infinitive,
	verbForms,
	error,
	className,
	isLoading,
}: ConjugationProps) {
	const [openSections, setOpenSections] = React.useState<Set<number>>(new Set([0]));

	const toggleSection = (index: number) => {
		setOpenSections((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	};

	// Handle loading or incomplete streaming data
	if (isLoading || !infinitive || !verbForms) {
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
				data-slot="reverso-conjugation"
			>
				<p className="text-sm text-destructive">Erreur: {error}</p>
			</div>
		);
	}

	return (
		<div
			className={cn("rounded-xl border bg-card overflow-hidden", className)}
			data-tool-ui-id={id}
			data-slot="reverso-conjugation"
		>
			{/* Header */}
			<div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
				<BookOpen className="h-4 w-4 text-muted-foreground" />
				<span className="text-sm font-medium">Conjugaison</span>
			</div>

			{/* Content */}
			<div className="p-4 space-y-3">
				{/* Infinitive */}
				<div>
					<p className="text-sm text-muted-foreground mb-1">Verbe</p>
					<p className="text-lg font-semibold">{infinitive}</p>
				</div>

				{/* Conjugation forms */}
				{verbForms && verbForms.length > 0 ? (
					<div className="space-y-2">
						{verbForms.map((form, index) => {
							const isOpen = openSections.has(index);
							return (
								<Collapsible.Root
									key={form.id}
									open={isOpen}
									onOpenChange={() => toggleSection(index)}
								>
									<div className="rounded-lg border bg-muted/30 overflow-hidden">
										{/* Collapsible header */}
										<Collapsible.Trigger asChild>
											<button className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors">
												<span className="text-sm font-medium">{form.conjugation}</span>
												<ChevronDown
													className={cn(
														"h-4 w-4 text-muted-foreground transition-transform",
														isOpen && "rotate-180"
													)}
												/>
											</button>
										</Collapsible.Trigger>

										{/* Collapsible content */}
										<Collapsible.Content>
											<div className="px-3 pb-3 pt-1 space-y-1.5">
												{form.verbs.map((verb, i) => (
													<div
														key={i}
														className="text-sm text-muted-foreground font-mono"
													>
														{verb}
													</div>
												))}
											</div>
										</Collapsible.Content>
									</div>
								</Collapsible.Root>
							);
						})}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">Aucune conjugaison disponible</p>
				)}
			</div>
		</div>
	);
}
