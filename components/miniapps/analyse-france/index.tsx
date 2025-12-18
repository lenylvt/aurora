"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMiniApps } from "@/components/miniapps";
import { useSidebar } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/appwrite/client";
import { getPoemById } from "@/lib/appwrite/miniapps/poems";
import type { Poem, UserResult } from "@/types/miniapps";
import PoemSelector from "./poem-selector";
import StanzaAnalysis from "./stanza-analysis";
import ResultsView from "./results-view";
import Progress from "./progress";
import EvaluationLoading from "./evaluation-loading";

type InternalView = "select" | "analyze" | "loading" | "results";

interface AnalyseAnswer {
    selectedWords: string[];
    analysis: string;
}

const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

const pageTransition = {
    type: "tween" as const,
    ease: "easeInOut" as const,
    duration: 0.2,
};

export default function AnalyseFrance() {
    const { closeMiniApp, currentView, setCurrentView } = useMiniApps();
    const { setOpen } = useSidebar();
    const [internalView, setInternalView] = useState<InternalView>("select");
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedPoem, setSelectedPoem] = useState<Poem | null>(null);
    const [evaluationResult, setEvaluationResult] = useState<UserResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingAnalyses, setPendingAnalyses] = useState<AnalyseAnswer[]>([]);

    useEffect(() => {
        async function init() {
            try {
                const user = await getCurrentUser();
                if (user) {
                    setUserId(user.$id);
                }
            } catch (error) {
                console.error("[AnalyseFrance] Error getting user:", error);
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, []);

    const handlePoemSelect = async (poemId: string) => {
        const poem = await getPoemById(poemId);
        if (poem) {
            setSelectedPoem(poem);
            setInternalView("analyze");
            // Close sidebar when starting analysis
            setOpen(false);
        }
    };

    const handleBack = () => {
        if (internalView === "analyze") {
            setSelectedPoem(null);
            setInternalView("select");
        } else if (internalView === "results" || internalView === "loading") {
            setInternalView("select");
            setEvaluationResult(null);
            setPendingAnalyses([]);
        }
    };

    const handleSubmitAnalyses = async (analyses: AnalyseAnswer[]) => {
        if (!selectedPoem || !userId) return;

        setPendingAnalyses(analyses);
        setInternalView("loading");

        try {
            const response = await fetch("/api/analyse-france/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    poem: {
                        id: selectedPoem.$id,
                        title: selectedPoem.title,
                        author: selectedPoem.author,
                        fullText: selectedPoem.fullText,
                    },
                    analyses,
                    mode: "complete",
                }),
            });

            if (!response.ok) {
                throw new Error("Evaluation failed");
            }

            const result = await response.json();
            setEvaluationResult(result);
            setInternalView("results");
        } catch (error) {
            console.error("[AnalyseFrance] Error evaluating:", error);
            setInternalView("analyze");
        }
    };

    const handleViewResult = async (result: UserResult) => {
        const poem = await getPoemById(result.poemId);
        if (poem) {
            setSelectedPoem(poem);
            setEvaluationResult(result);
            setCurrentView("main");
            setInternalView("results");
        }
    };

    const handleHome = () => {
        setInternalView("select");
        setSelectedPoem(null);
        setEvaluationResult(null);
        setPendingAnalyses([]);
    };

    const handleCloseMiniApp = () => {
        closeMiniApp();
    };

    if (isLoading && !userId) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <p className="text-muted-foreground">Connexion requise</p>
            </div>
        );
    }

    // Determine which view to render
    const viewKey = currentView === "progress" ? "progress" : internalView;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={viewKey}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                className="h-full"
            >
                {currentView === "progress" ? (
                    <Progress
                        userId={userId}
                        onBack={() => setCurrentView("main")}
                        onViewResult={handleViewResult}
                    />
                ) : internalView === "select" ? (
                    <PoemSelector
                        onSelect={handlePoemSelect}
                        onProgress={() => setCurrentView("progress")}
                        onBack={handleCloseMiniApp}
                    />
                ) : internalView === "analyze" && selectedPoem ? (
                    <StanzaAnalysis
                        poem={selectedPoem}
                        stanzaIndex={0}
                        totalStanzas={selectedPoem.stanzas.length}
                        mode="complete"
                        userId={userId}
                        onSubmit={handleSubmitAnalyses}
                        onBack={handleBack}
                    />
                ) : internalView === "loading" ? (
                    <EvaluationLoading
                        poemTitle={selectedPoem?.title || ""}
                        analysisCount={pendingAnalyses.length}
                    />
                ) : internalView === "results" && selectedPoem && evaluationResult ? (
                    <ResultsView
                        poem={selectedPoem}
                        evaluations={evaluationResult.evaluations}
                        averageScore={evaluationResult.averageScore}
                        onHome={handleHome}
                    />
                ) : null}
            </motion.div>
        </AnimatePresence>
    );
}
