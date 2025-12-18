"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Check,
    X,
    Loader2,
    Eye,
    Sparkles,
    AlertCircle,
    Plus,
} from "lucide-react";
import type { Poem } from "@/types/miniapps";
import {
    createAnalysis,
    deleteAnalysis,
    getIncompleteAnalyses,
} from "@/lib/appwrite/miniapps/analyses";

interface StanzaAnalysisProps {
    poem: Poem;
    stanzaIndex: number;
    totalStanzas: number;
    mode: "complete" | "quick";
    userId: string;
    onSubmit?: (analyses: { selectedWords: string[]; analysis: string }[]) => void;
    onBack?: () => void;
}

interface WordData {
    cleanWord: string;
    prefix: string;
    suffix: string;
    stanzaId: number;
    uniqueId: string;
}

interface SavedAnalysis {
    selectedWords: string[];
    analysis: string;
}

export default function StanzaAnalysis({
    poem,
    stanzaIndex,
    totalStanzas,
    mode,
    userId,
    onSubmit,
    onBack,
}: StanzaAnalysisProps) {
    const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
    const [analysis, setAnalysis] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showResumeDialog, setShowResumeDialog] = useState(false);
    const [hasLoadedIncomplete, setHasLoadedIncomplete] = useState(false);
    const dragStartWordId = useRef<string | null>(null);

    const isComplete = mode === "complete";
    const stanza = poem.stanzas[stanzaIndex];

    // Parse words
    const allWords: WordData[] = [];
    const stanzasToShow = isComplete ? poem.stanzas : [stanza];

    stanzasToShow.forEach((s, idx) => {
        s.lines.forEach((line) => {
            const words = line.split(/(\s+|[.,;:!?'"-]+)/);
            words.forEach((word) => {
                if (word.trim()) {
                    const match = word.match(/^([.,;:!?'"-]*)([^.,;:!?'"-]+)([.,;:!?'"-]*)$/);
                    const prefix = match?.[1] || "";
                    const cleanWord = match?.[2] || word;
                    const suffix = match?.[3] || "";
                    const stanzaId = isComplete ? idx : stanzaIndex;
                    const uniqueId = `${stanzaId}-${cleanWord}-${allWords.filter((w) => w.cleanWord === cleanWord && w.stanzaId === stanzaId).length
                        }`;
                    allWords.push({ cleanWord, prefix, suffix, stanzaId, uniqueId });
                }
            });
        });
    });

    // Load incomplete
    useEffect(() => {
        const loadIncomplete = async () => {
            if (hasLoadedIncomplete) return;
            try {
                const incompletes = await getIncompleteAnalyses(userId, poem.$id);
                if (incompletes.length > 0) {
                    setShowResumeDialog(true);
                    setHasLoadedIncomplete(true);
                }
            } catch (error) {
                console.error("[StanzaAnalysis] Error:", error);
            }
        };
        loadIncomplete();
    }, [userId, poem.$id, hasLoadedIncomplete]);

    const handleResumeAnalysis = async () => {
        const incompletes = await getIncompleteAnalyses(userId, poem.$id);
        const allAnalyses = incompletes.map((incomplete) => {
            const selectedWordsDisplay = incomplete.selectedWords.map((uniqueId) => {
                const wordData = allWords.find((w) => w.uniqueId === uniqueId);
                return wordData?.cleanWord || uniqueId;
            });
            return { selectedWords: selectedWordsDisplay, analysis: incomplete.analysis };
        });
        setSavedAnalyses(allAnalyses);
        setShowResumeDialog(false);
    };

    const handleStartNew = async () => {
        const incompletes = await getIncompleteAnalyses(userId, poem.$id);
        for (const a of incompletes) await deleteAnalysis(a.$id);
        setShowResumeDialog(false);
    };

    const handleWordMouseDown = useCallback((uniqueId: string) => {
        setIsDragging(true);
        dragStartWordId.current = uniqueId;
        setSelectedWordIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(uniqueId)) newSet.delete(uniqueId);
            else newSet.add(uniqueId);
            return newSet;
        });
    }, []);

    const handleWordMouseEnter = useCallback(
        (uniqueId: string) => {
            if (isDragging && dragStartWordId.current !== uniqueId) {
                setSelectedWordIds((prev) => new Set(prev).add(uniqueId));
            }
        },
        [isDragging]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        dragStartWordId.current = null;
    }, []);

    useEffect(() => {
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseUp]);

    const clearAll = () => {
        setSelectedWordIds(new Set());
        setAnalysis("");
    };

    const handleSaveAnalysis = async () => {
        if (!analysis.trim()) return;

        const selectedWordsDisplay = Array.from(selectedWordIds).map((id) => {
            const wordData = allWords.find((w) => w.uniqueId === id);
            return wordData?.cleanWord || "";
        });
        const selectedWordsIds = Array.from(selectedWordIds);

        setSavedAnalyses([...savedAnalyses, { selectedWords: selectedWordsDisplay, analysis }]);

        try {
            setIsSaving(true);
            await createAnalysis({
                userId,
                poemId: poem.$id,
                poemTitle: poem.title,
                stanzaId: stanzaIndex,
                selectedWords: selectedWordsIds,
                analysis,
                completed: false,
            });
        } catch (error) {
            console.error("[StanzaAnalysis] Error saving:", error);
        } finally {
            setIsSaving(false);
        }

        setSelectedWordIds(new Set());
        setAnalysis("");
    };

    const handleDeleteAnalysis = (index: number) => {
        setSavedAnalyses(savedAnalyses.filter((_, i) => i !== index));
    };

    const handleSubmitToAI = async () => {
        if (savedAnalyses.length === 0 || !onSubmit) return;

        try {
            setIsSaving(true);
            const incompletes = await getIncompleteAnalyses(userId, poem.$id);
            for (const incomplete of incompletes) await deleteAnalysis(incomplete.$id);
            onSubmit(savedAnalyses.map((sa) => ({ selectedWords: sa.selectedWords, analysis: sa.analysis })));
        } catch (error) {
            console.error("[StanzaAnalysis] Error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderStanza = (s: typeof stanza, displayNumber: number) => {
        const stanzaWords = allWords.filter(
            (w) => w.stanzaId === (isComplete ? displayNumber - 1 : stanzaIndex)
        );
        let wordCounter = 0;

        return (
            <div key={displayNumber} className="mb-6">
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                    Strophe {displayNumber}
                </div>
                {s.lines.map((line, lineIdx) => {
                    const words = line.split(/(\s+|[.,;:!?'"-]+)/);
                    const lineWords: React.ReactNode[] = [];

                    words.forEach((word, wordIdx) => {
                        if (!word.trim()) {
                            lineWords.push(<span key={`space-${lineIdx}-${wordIdx}`}>{word}</span>);
                            return;
                        }
                        const wordData = stanzaWords[wordCounter];
                        wordCounter++;
                        if (!wordData) return;

                        const isSelected = selectedWordIds.has(wordData.uniqueId);
                        lineWords.push(
                            <button
                                key={wordData.uniqueId}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleWordMouseDown(wordData.uniqueId);
                                }}
                                onMouseEnter={() => handleWordMouseEnter(wordData.uniqueId)}
                                className={`inline-flex items-baseline px-0.5 -mx-0.5 cursor-pointer select-none rounded transition-colors ${isSelected
                                        ? "bg-primary text-primary-foreground font-medium"
                                        : "hover:bg-muted"
                                    }`}
                            >
                                {wordData.prefix && <span className="opacity-60">{wordData.prefix}</span>}
                                <span>{wordData.cleanWord}</span>
                                {wordData.suffix && <span className="opacity-60">{wordData.suffix}</span>}
                            </button>
                        );
                    });

                    return (
                        <div key={lineIdx} className="mb-1.5 leading-relaxed">
                            {lineWords}
                        </div>
                    );
                })}
            </div>
        );
    };

    const selectedWordsData = Array.from(selectedWordIds)
        .map((id) => allWords.find((w) => w.uniqueId === id))
        .filter(Boolean);

    return (
        <div
            className="flex h-full bg-background"
            style={{ ["--thread-max-width" as string]: "42rem" }}
        >
            {/* Poem Panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="shrink-0 border-b px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Retour
                            </Button>
                            <div className="h-4 w-px bg-border" />
                            <div>
                                <h1 className="font-semibold">{poem.title}</h1>
                                <p className="text-xs text-muted-foreground">
                                    {isComplete ? `${totalStanzas} strophes` : `Strophe ${stanzaIndex + 1}/${totalStanzas}`}
                                </p>
                            </div>
                        </div>
                        {savedAnalyses.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowReviewDialog(true)}
                                className="gap-2 rounded-full"
                            >
                                <Eye className="w-4 h-4" />
                                <Badge variant="secondary" className="h-5 px-1.5">
                                    {savedAnalyses.length}
                                </Badge>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Poem text */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-2xl text-lg leading-relaxed select-none">
                        {stanzasToShow.map((s, idx) => renderStanza(s, idx + 1))}
                    </div>
                </div>
            </div>

            {/* Analysis Panel */}
            <div className="w-80 border-l flex flex-col bg-muted/30">
                <div className="flex-1 flex flex-col p-4 gap-3 min-h-0">
                    {/* Selected words */}
                    {selectedWordIds.size > 0 && (
                        <div className="rounded-2xl bg-background border p-3 fade-in animate-in duration-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {selectedWordIds.size} mot{selectedWordIds.size > 1 ? "s" : ""}
                                </p>
                                <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs px-2">
                                    Effacer
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedWordsData.map((wordData) =>
                                    wordData ? (
                                        <Badge key={wordData.uniqueId} variant="secondary" className="text-xs pr-1 rounded-full">
                                            {wordData.cleanWord}
                                            <button
                                                onClick={() => setSelectedWordIds((prev) => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(wordData.uniqueId);
                                                    return newSet;
                                                })}
                                                className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ) : null
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analysis input */}
                    <div className="flex-1 flex flex-col min-h-0 gap-2">
                        <label className="text-xs font-medium text-muted-foreground">
                            {selectedWordIds.size === 0 ? "Analyse générale" : "Analyse des mots"}
                        </label>
                        <Textarea
                            value={analysis}
                            onChange={(e) => setAnalysis(e.target.value)}
                            placeholder="Écrivez votre analyse..."
                            className="flex-1 min-h-0 resize-none rounded-2xl"
                        />
                        <Button
                            onClick={handleSaveAnalysis}
                            disabled={!analysis.trim() || isSaving}
                            className="w-full gap-2 rounded-xl"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Ajouter l'analyse
                        </Button>
                    </div>

                    {/* Saved count */}
                    {savedAnalyses.length > 0 && (
                        <div className="border-t pt-3">
                            <Button
                                onClick={handleSubmitToAI}
                                disabled={isSaving}
                                className="w-full gap-2 rounded-xl"
                                variant="default"
                            >
                                <Sparkles className="w-4 h-4" />
                                Soumettre ({savedAnalyses.length})
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Dialog */}
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Vos analyses</DialogTitle>
                        <DialogDescription>
                            Vérifiez vos analyses avant de les soumettre à l'IA.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {savedAnalyses.map((saved, idx) => (
                            <div key={idx} className="rounded-2xl bg-muted/50 p-4 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium mb-2">
                                            {saved.selectedWords.length > 0 ? saved.selectedWords.join(" • ") : "Analyse générale"}
                                        </p>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {saved.analysis}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteAnalysis(idx)}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowReviewDialog(false)} className="w-full sm:w-auto rounded-xl">
                            Fermer
                        </Button>
                        {savedAnalyses.length > 0 && (
                            <Button
                                onClick={() => {
                                    handleSubmitToAI();
                                    setShowReviewDialog(false);
                                }}
                                disabled={isSaving}
                                className="w-full sm:w-auto gap-2 rounded-xl"
                            >
                                <Sparkles className="w-4 h-4" />
                                Soumettre ({savedAnalyses.length})
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resume Dialog */}
            <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Reprendre votre analyse ?</DialogTitle>
                        <DialogDescription>
                            Vous avez des analyses en cours. Voulez-vous reprendre ou recommencer ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={handleStartNew} className="flex-1 rounded-xl">
                            Recommencer
                        </Button>
                        <Button onClick={handleResumeAnalysis} className="flex-1 rounded-xl">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Reprendre
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
