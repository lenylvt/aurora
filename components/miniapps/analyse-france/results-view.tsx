"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    ChevronRight,
    Home,
    AlertCircle,
    CheckCircle2,
    Trophy,
    Sparkles,
    Quote,
    Type,
} from "lucide-react";
import type { Poem, AIEvaluation } from "@/types/miniapps";
import ReactMarkdown from "react-markdown";

interface ResultsViewProps {
    poem: Poem;
    evaluations: AIEvaluation[];
    averageScore: number;
    onHome: () => void;
    skipIntro?: boolean;
}

export default function ResultsView({
    poem,
    evaluations,
    averageScore,
    onHome,
    skipIntro = false,
}: ResultsViewProps) {
    const [expandedAnalysis, setExpandedAnalysis] = useState<number | null>(null);
    const [showContent, setShowContent] = useState(skipIntro);
    const [showScore, setShowScore] = useState(skipIntro);

    useEffect(() => {
        if (skipIntro) return;
        const scoreTimer = setTimeout(() => setShowScore(true), 500);
        const contentTimer = setTimeout(() => setShowContent(true), 1500);
        return () => {
            clearTimeout(scoreTimer);
            clearTimeout(contentTimer);
        };
    }, [skipIntro]);

    const getScoreColor = (score: number) => {
        if (score >= 16) return "text-green-600 dark:text-green-400";
        if (score >= 12) return "text-blue-600 dark:text-blue-400";
        if (score >= 10) return "text-orange-600 dark:text-orange-400";
        return "text-red-600 dark:text-red-400";
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 16) return "bg-green-100 dark:bg-green-900/30";
        if (score >= 12) return "bg-blue-100 dark:bg-blue-900/30";
        if (score >= 10) return "bg-orange-100 dark:bg-orange-900/30";
        return "bg-red-100 dark:bg-red-900/30";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 16) return { text: "Excellent !", emoji: "🎉" };
        if (score >= 12) return { text: "Bien joué", emoji: "👏" };
        if (score >= 10) return { text: "Passable", emoji: "📚" };
        return { text: "À améliorer", emoji: "💪" };
    };

    const globalFeedback = evaluations[0]?.analysis || evaluations[0]?.feedback || "";
    const scoreInfo = getScoreLabel(averageScore);

    return (
        <div
            className="flex h-full flex-col bg-background"
            style={{ ["--thread-max-width" as string]: "42rem" }}
        >
            <div className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-6 pb-24">
                {/* Header */}
                <div className="mx-auto w-full max-w-[var(--thread-max-width)] mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Button variant="ghost" size="sm" onClick={onHome} className="-ml-2 gap-2">
                            <Home className="w-4 h-4" />
                            Accueil
                        </Button>
                    </div>

                    {/* Score reveal */}
                    <div
                        className={`text-center transition-all duration-700 ${showScore ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        <div className="inline-flex items-center justify-center mb-4">
                            <div className="relative">
                                <div className={`flex h-28 w-28 items-center justify-center rounded-full ${getScoreBgColor(averageScore)}`}>
                                    <Trophy className={`h-14 w-14 ${getScoreColor(averageScore)}`} />
                                </div>
                                {showScore && (
                                    <div className="absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-background border-2 text-2xl shadow-lg">
                                        {scoreInfo.emoji}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`mb-2 text-6xl font-bold ${getScoreColor(averageScore)}`}>
                            {averageScore.toFixed(1)}
                            <span className="text-2xl text-muted-foreground">/20</span>
                        </div>
                        <p className="text-xl font-medium">{scoreInfo.text}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {poem.title} • {poem.author}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div
                    className={`mx-auto w-full max-w-[var(--thread-max-width)] space-y-4 transition-all duration-500 ${showContent ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {/* Global Feedback */}
                    {globalFeedback && (
                        <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-5 fade-in animate-in duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <p className="font-semibold">Feedback global</p>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{globalFeedback.replace(/\\n/g, "\n")}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Analyses */}
                    <div className="flex items-center justify-between px-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {evaluations.length} analyse{evaluations.length > 1 ? "s" : ""} évaluée
                            {evaluations.length > 1 ? "s" : ""}
                        </p>
                    </div>

                    {evaluations.map((evaluation, idx) => {
                        const isExpanded = expandedAnalysis === idx;
                        const studentInput = evaluation.studentInput;

                        return (
                            <div
                                key={idx}
                                className="rounded-2xl border bg-background overflow-hidden fade-in slide-in-from-bottom-2 animate-in shadow-sm"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <button
                                    onClick={() => setExpandedAnalysis(isExpanded ? null : idx)}
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getScoreBgColor(evaluation.score)}`}>
                                            <span className={`text-lg font-bold ${getScoreColor(evaluation.score)}`}>
                                                {evaluation.score}
                                            </span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold">
                                                Analyse {idx + 1}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {studentInput?.selectedWords?.length
                                                    ? `${studentInput.selectedWords.length} mots analysés`
                                                    : "Cliquez pour voir le détail"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {evaluation.strengths?.length > 0 && (
                                            <Badge variant="secondary" className="gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                {evaluation.strengths.length}
                                            </Badge>
                                        )}
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t p-5 space-y-5 bg-muted/10 fade-in animate-in duration-200">
                                        {/* Student Input Section */}
                                        {studentInput && (
                                            <div className="space-y-3">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                    <Type className="w-4 h-4" />
                                                    Votre analyse
                                                </p>

                                                {/* Selected Words */}
                                                {studentInput.selectedWords?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {studentInput.selectedWords.map((word, i) => (
                                                            <Badge
                                                                key={i}
                                                                variant="outline"
                                                                className="bg-primary/10 border-primary/30"
                                                            >
                                                                {word}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Student Analysis */}
                                                <div className="rounded-xl bg-muted/50 p-4 border-l-4 border-primary/30">
                                                    <div className="flex items-start gap-2">
                                                        <Quote className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                                        <p className="text-sm italic text-muted-foreground">
                                                            {studentInput.analysis}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Feedback */}
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                                Feedback du professeur
                                            </p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{evaluation.feedback.replace(/\\n/g, "\n")}</ReactMarkdown>
                                            </div>
                                        </div>

                                        {/* Strengths */}
                                        {evaluation.strengths?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                        Points forts
                                                    </p>
                                                </div>
                                                <ul className="space-y-2">
                                                    {evaluation.strengths.map((strength, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm">
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 shrink-0 mt-0.5">
                                                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                            </div>
                                                            <span>{strength}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Missed Points */}
                                        {evaluation.missedPoints?.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                        À améliorer
                                                    </p>
                                                </div>
                                                <ul className="space-y-2">
                                                    {evaluation.missedPoints.map((point, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm">
                                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 shrink-0 mt-0.5">
                                                                <AlertCircle className="w-3 h-3 text-orange-600" />
                                                            </div>
                                                            <span>{point}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
