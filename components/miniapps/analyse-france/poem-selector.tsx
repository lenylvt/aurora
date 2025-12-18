"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    BookOpen,
    Search,
    X,
    Clock,
    FileText,
    ChevronRight,
} from "lucide-react";
import { getCurrentUser } from "@/lib/appwrite/client";
import { getAllPoemsProgressive } from "@/lib/appwrite/miniapps/poems";
import { getIncompleteAnalyses } from "@/lib/appwrite/miniapps/analyses";
import { getUserResultsStats } from "@/lib/appwrite/miniapps/results";
import type { Poem } from "@/types/miniapps";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PoemSelectorProps {
    onSelect: (poemId: string) => void;
    onProgress: () => void;
    onBack: () => void;
}

export default function PoemSelector({
    onSelect,
    onProgress,
    onBack,
}: PoemSelectorProps) {
    const [poems, setPoems] = useState<Poem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
    const [incompletePoems, setIncompletePoems] = useState<Set<string>>(new Set());
    const [selectedAnalysis, setSelectedAnalysis] = useState<{
        title: string;
        analysis: string;
    } | null>(null);
    const [stats, setStats] = useState({ totalTests: 0, averageScore: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const user = await getCurrentUser();
            if (!user) return;

            const loadedPoems: Poem[] = [];
            await getAllPoemsProgressive((poem) => {
                loadedPoems.push(poem);
                setPoems([...loadedPoems].sort((a, b) => a.title.localeCompare(b.title)));
            });

            const incomplete = new Set<string>();
            for (const poem of loadedPoems) {
                const analyses = await getIncompleteAnalyses(user.$id, poem.$id);
                if (analyses.length > 0) incomplete.add(poem.$id);
            }
            setIncompletePoems(incomplete);

            const userStats = await getUserResultsStats(user.$id);
            setStats({ totalTests: userStats.totalTests, averageScore: userStats.averageScore });
        } catch (error) {
            console.error("[PoemSelector] Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPoems = poems.filter((poem) => {
        const matchesSearch =
            searchQuery === "" ||
            poem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            poem.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAuthor = selectedAuthor === null || poem.author === selectedAuthor;
        return matchesSearch && matchesAuthor;
    });

    const authors = Array.from(new Set(poems.map((p) => p.author)));

    return (
        <div
            className="flex h-full flex-col bg-background"
            style={{ ["--thread-max-width" as string]: "42rem" }}
        >
            {/* Viewport - scrollable content */}
            <div className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 pt-8 pb-24">
                {/* Welcome header - like ThreadWelcome */}
                <div className="mx-auto w-full max-w-[var(--thread-max-width)] grow flex flex-col">
                    <div className="flex flex-col justify-center mb-8">
                        <h1 className="text-4xl font-bold fade-in animate-in duration-200">
                            Choisir un poème 📖
                        </h1>
                        <p className="text-muted-foreground mt-1 fade-in animate-in duration-200 delay-75">
                            {stats.totalTests > 0
                                ? `${stats.totalTests} analyses • Moyenne: ${stats.averageScore}/20`
                                : "Sélectionnez un poème pour commencer"}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher un poème ou un auteur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-10 h-12 rounded-2xl border-input bg-background"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Author filter */}
                    {authors.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Button
                                variant={selectedAuthor === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedAuthor(null)}
                                className="rounded-full"
                            >
                                Tous
                            </Button>
                            {authors.map((author) => (
                                <Button
                                    key={author}
                                    variant={selectedAuthor === author ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedAuthor(author)}
                                    className="rounded-full"
                                >
                                    {author}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* Poems list - like ThreadSuggestions style */}
                    <div className="space-y-2">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 rounded-2xl border bg-background p-4 fade-in animate-in"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))
                        ) : filteredPoems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground mb-2">Aucun poème trouvé</p>
                                {(searchQuery || selectedAuthor) && (
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedAuthor(null);
                                        }}
                                    >
                                        Réinitialiser les filtres
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredPoems.map((poem, index) => {
                                const hasIncomplete = incompletePoems.has(poem.$id);
                                return (
                                    <div
                                        key={poem.$id}
                                        className={`group rounded-2xl border p-4 transition-all duration-200 fade-in slide-in-from-bottom-2 animate-in ${hasIncomplete ? "bg-amber-500/5 border-amber-500/30" : "bg-background hover:border-primary hover:bg-muted/50"
                                            }`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div
                                            className={`flex w-full items-center gap-4 ${!hasIncomplete ? "cursor-pointer" : ""}`}
                                            onClick={() => !hasIncomplete && onSelect(poem.$id)}
                                            role={!hasIncomplete ? "button" : undefined}
                                            tabIndex={!hasIncomplete ? 0 : undefined}
                                            onKeyDown={(e) => !hasIncomplete && e.key === "Enter" && onSelect(poem.$id)}
                                        >
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${hasIncomplete ? "bg-amber-500/10" : "bg-muted"
                                                }`}>
                                                {hasIncomplete ? (
                                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                                ) : (
                                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{poem.title}</h3>
                                                <p className="text-sm text-muted-foreground truncate">{poem.author}</p>
                                                {hasIncomplete && (
                                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                        Analyse en cours
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {poem.analyses && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAnalysis({
                                                                title: poem.title,
                                                                analysis: poem.analyses || "",
                                                            });
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                        className="h-8 w-8 p-0 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                )}
                                                {!hasIncomplete && (
                                                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Restart buttons for incomplete analyses */}
                                        {hasIncomplete && (
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-amber-500/20">
                                                <Button
                                                    onClick={() => onSelect(poem.$id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 rounded-xl"
                                                >
                                                    Continuer
                                                </Button>
                                                <Button
                                                    onClick={async () => {
                                                        const user = await getCurrentUser();
                                                        if (user) {
                                                            const { deleteIncompleteAnalysesForPoem } = await import("@/lib/appwrite/miniapps/analyses");
                                                            await deleteIncompleteAnalysesForPoem(user.$id, poem.$id);
                                                            setIncompletePoems(prev => {
                                                                const next = new Set(prev);
                                                                next.delete(poem.$id);
                                                                return next;
                                                            });
                                                            onSelect(poem.$id);
                                                        }
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex-1 rounded-xl text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                                                >
                                                    Recommencer
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Analysis Modal */}
            <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
                <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden rounded-2xl p-0">
                    <DialogHeader className="p-6 pb-4 border-b shrink-0">
                        <DialogTitle className="text-xl font-bold">{selectedAnalysis?.title}</DialogTitle>
                        <p className="text-sm text-muted-foreground">Analyse de référence du poème</p>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="prose prose-base dark:prose-invert max-w-none 
                            prose-headings:font-bold prose-headings:text-foreground
                            prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:pb-2
                            prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
                            prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
                            prose-p:leading-relaxed prose-p:mb-4
                            prose-li:my-1
                            prose-strong:text-foreground prose-strong:font-semibold
                            prose-em:text-primary/80
                            prose-ul:my-3 prose-ol:my-3
                            prose-hr:my-6 prose-hr:border-border
                            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-muted prose-pre:border prose-pre:rounded-xl prose-pre:p-4
                        ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    // Custom headings with emoji support
                                    h1: ({ children }) => (
                                        <h1 className="text-2xl font-bold text-foreground border-b border-border pb-3 mb-4 mt-6 first:mt-0">
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children }) => (
                                        <h2 className="text-xl font-bold text-foreground mb-3 mt-6 flex items-center gap-2">
                                            {children}
                                        </h2>
                                    ),
                                    h3: ({ children }) => (
                                        <h3 className="text-lg font-semibold text-foreground mb-2 mt-4 flex items-center gap-2">
                                            {children}
                                        </h3>
                                    ),
                                    // Custom paragraph
                                    p: ({ children }) => (
                                        <p className="leading-relaxed mb-4 text-foreground/90">
                                            {children}
                                        </p>
                                    ),
                                    // Custom lists with better styling
                                    ul: ({ children }) => (
                                        <ul className="my-3 ml-1 space-y-2">
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="my-3 ml-1 space-y-2 list-decimal list-inside">
                                            {children}
                                        </ol>
                                    ),
                                    li: ({ children }) => (
                                        <li className="flex items-start gap-2 text-foreground/90">
                                            <span className="text-primary mt-1.5 shrink-0">•</span>
                                            <span className="flex-1">{children}</span>
                                        </li>
                                    ),
                                    // Strong text
                                    strong: ({ children }) => (
                                        <strong className="font-semibold text-foreground">{children}</strong>
                                    ),
                                    // Emphasis
                                    em: ({ children }) => (
                                        <em className="italic text-primary/80">{children}</em>
                                    ),
                                    // Custom code block rendering for poem excerpts
                                    code: ({ className, children, ...props }) => {
                                        const isBlock = className?.includes('language-');
                                        if (isBlock) {
                                            return (
                                                <pre className="bg-muted/50 border rounded-xl p-4 my-4 overflow-x-auto">
                                                    <code className="text-sm font-mono italic text-foreground/80 whitespace-pre-wrap">
                                                        {children}
                                                    </code>
                                                </pre>
                                            );
                                        }
                                        return <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-medium" {...props}>{children}</code>;
                                    },
                                    // Custom blockquote for intro/conclusion
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-primary bg-primary/5 py-3 px-4 rounded-r-lg my-4 not-italic">
                                            {children}
                                        </blockquote>
                                    ),
                                    // Horizontal rule
                                    hr: () => <hr className="my-8 border-border" />,
                                }}
                            >
                                {selectedAnalysis?.analysis
                                    ?.replace(/\\n/g, "\n")
                                    ?.replace(/\\t/g, "    ")
                                    ?.replace(/\\r/g, "")
                                    || ""}
                            </ReactMarkdown>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
