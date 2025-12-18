"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Trophy,
    Target,
    Award,
    BookOpen,
    Trash2,
    Eye,
    BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getUserResults, getUserResultsStats, deleteResult } from "@/lib/appwrite/miniapps/results";
import type { UserResult } from "@/types/miniapps";
import ReactMarkdown from "react-markdown";

interface ProgressProps {
    userId: string;
    onBack: () => void;
    onViewResult: (result: UserResult) => void;
}

export default function Progress({ userId, onBack, onViewResult }: ProgressProps) {
    const [results, setResults] = useState<UserResult[]>([]);
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        recentTests: 0,
        poemsTested: 0,
    });
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [resultsData, statsData] = await Promise.all([
                getUserResults(userId),
                getUserResultsStats(userId),
            ]);
            setResults(resultsData);
            setStats(statsData);
        } catch (error) {
            console.error("[Progress] Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (resultId: string) => {
        if (!confirm("Supprimer ce résultat ?")) return;
        try {
            setDeletingId(resultId);
            await deleteResult(resultId);
            await loadData();
        } catch (error) {
            console.error("[Progress] Error deleting:", error);
        } finally {
            setDeletingId(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 16) return "text-green-600 dark:text-green-400";
        if (score >= 12) return "text-blue-600 dark:text-blue-400";
        if (score >= 10) return "text-orange-600 dark:text-orange-400";
        return "text-red-600 dark:text-red-400";
    };

    return (
        <div
            className="flex h-full flex-col bg-background"
            style={{ ["--thread-max-width" as string]: "42rem" }}
        >
            <div className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-6 pb-24">
                {/* Header - like PoemSelector */}
                <div className="mx-auto w-full max-w-[var(--thread-max-width)] mb-8">
                    <h1 className="text-4xl font-bold fade-in animate-in duration-200">
                        Suivi de progression 📊
                    </h1>
                    <p className="text-muted-foreground mt-1 fade-in animate-in duration-200 delay-75">
                        Vos statistiques et historique d'analyses
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="mx-auto w-full max-w-[var(--thread-max-width)] mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-2xl" />
                            ))
                        ) : (
                            <>
                                <div className="flex flex-col items-center justify-center rounded-2xl border bg-background p-4 fade-in animate-in duration-200">
                                    <Trophy className="h-6 w-6 mb-2 text-yellow-600" />
                                    <span className="text-2xl font-bold">{stats.totalTests}</span>
                                    <span className="text-xs text-muted-foreground">Tests</span>
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-2xl border bg-background p-4 fade-in animate-in duration-200" style={{ animationDelay: "50ms" }}>
                                    <Target className="h-6 w-6 mb-2 text-blue-600" />
                                    <span className="text-2xl font-bold">{stats.averageScore}</span>
                                    <span className="text-xs text-muted-foreground">Moyenne</span>
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-2xl border bg-background p-4 fade-in animate-in duration-200" style={{ animationDelay: "100ms" }}>
                                    <Award className="h-6 w-6 mb-2 text-green-600" />
                                    <span className="text-2xl font-bold">{stats.bestScore}</span>
                                    <span className="text-xs text-muted-foreground">Meilleur</span>
                                </div>
                                <div className="flex flex-col items-center justify-center rounded-2xl border bg-background p-4 fade-in animate-in duration-200" style={{ animationDelay: "150ms" }}>
                                    <BookOpen className="h-6 w-6 mb-2 text-purple-600" />
                                    <span className="text-2xl font-bold">{stats.poemsTested}</span>
                                    <span className="text-xs text-muted-foreground">Poèmes</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Results List */}
                <div className="mx-auto w-full max-w-[var(--thread-max-width)]">
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                        Historique
                    </h2>

                    {loading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-2xl" />
                            ))}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Aucun test réalisé</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.map((result, idx) => (
                                <div
                                    key={result.$id}
                                    className="rounded-2xl border bg-background p-4 fade-in slide-in-from-bottom-2 animate-in"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate">{result.poemTitle}</h3>
                                            <p className="text-xs text-muted-foreground truncate mb-2">
                                                {result.poemAuthor}
                                            </p>
                                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                                <span className="px-2 py-0.5 rounded-full bg-muted">
                                                    {result.mode === "complete" ? "Complet" : "Rapide"}
                                                </span>
                                                <span>{result.totalStanzas} strophes</span>
                                                <span>•</span>
                                                <span>
                                                    {format(new Date(result.createdAt), "d MMM yyyy", { locale: fr })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={`text-2xl font-bold ${getScoreColor(result.averageScore)}`}>
                                                {result.averageScore.toFixed(1)}
                                                <span className="text-sm text-muted-foreground">/20</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3 pt-3 border-t">
                                        <Button
                                            onClick={() => onViewResult(result)}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2 rounded-xl"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Voir détail
                                        </Button>
                                        {result.evaluations[0]?.analysis && (
                                            <Button
                                                onClick={() => setSelectedAnalysis(result.evaluations[0].analysis || null)}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 rounded-xl"
                                            >
                                                Analyse
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleDelete(result.$id)}
                                            variant="ghost"
                                            size="sm"
                                            disabled={deletingId === result.$id}
                                            className="w-10 p-0 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis Modal */}
            <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Analyse complète</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{selectedAnalysis?.replace(/\\n/g, "\n") || ""}</ReactMarkdown>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
