"use client";

import { useEffect, useRef, useState, type FC, useCallback } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";
import {
    AlertCircleIcon,
    Loader2Icon,
    Maximize2Icon,
    XIcon,
    ZoomInIcon,
    ZoomOutIcon,
    RotateCcwIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

// Fullscreen Modal - fond propre, re-rendu haute qualité
const FullscreenModal: FC<{
    code: string;
    onClose: () => void;
}> = ({ code, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

    // Détecter dark mode
    const isDark =
        typeof window !== "undefined" &&
        document.documentElement.classList.contains("dark");

    // Re-rendu complet avec config haute qualité
    useEffect(() => {
        const render = async () => {
            try {
                // Config optimisée pour fullscreen - texte plus grand et net
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "base",
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                    securityLevel: "loose",
                    legacyMathML: true,
                    flowchart: {
                        useMaxWidth: false,
                        htmlLabels: true,
                        padding: 15,
                        nodeSpacing: 50,
                        rankSpacing: 50,
                    },
                    sequence: {
                        useMaxWidth: false,
                        boxMargin: 10,
                        mirrorActors: false,
                    },
                    themeVariables: isDark
                        ? {
                            fontSize: "18px",
                            primaryColor: "#6366F1",
                            primaryTextColor: "#F9FAFB",
                            primaryBorderColor: "#818CF8",
                            lineColor: "#71717A",
                            secondaryColor: "#3F3F46",
                            tertiaryColor: "#27272A",
                            background: "#18181B",
                            mainBkg: "#27272A",
                            nodeBorder: "#818CF8",
                            clusterBkg: "#27272A",
                            clusterBorder: "#52525B",
                            titleColor: "#FAFAFA",
                            edgeLabelBackground: "#27272A",
                            textColor: "#FAFAFA",
                            nodeTextColor: "#FAFAFA",
                        }
                        : {
                            fontSize: "18px",
                            primaryColor: "#6366F1",
                            primaryTextColor: "#18181B",
                            primaryBorderColor: "#4F46E5",
                            lineColor: "#71717A",
                            secondaryColor: "#E0E7FF",
                            tertiaryColor: "#EEF2FF",
                            background: "#FFFFFF",
                            mainBkg: "#F9FAFB",
                            nodeBorder: "#6366F1",
                            clusterBkg: "#F3F4F6",
                            clusterBorder: "#D1D5DB",
                            titleColor: "#111827",
                            edgeLabelBackground: "#FFFFFF",
                            textColor: "#18181B",
                            nodeTextColor: "#18181B",
                        },
                });

                const id = `mermaid-fs-${Date.now()}`;
                const { svg: rendered } = await mermaid.render(id, code.trim());
                setSvg(rendered);
            } catch (err) {
                console.error("Mermaid fullscreen error:", err);
                setError(err instanceof Error ? err.message : "Erreur de rendu");
            }
        };

        render();
    }, [code, isDark]);

    // Fit automatique
    const fitToScreen = useCallback(() => {
        if (!containerRef.current || !svgRef.current) return;

        const svgEl = svgRef.current.querySelector("svg");
        if (!svgEl) return;

        // Dimensions du SVG
        let svgWidth = 800;
        let svgHeight = 600;

        const viewBox = svgEl.getAttribute("viewBox");
        if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                svgWidth = parts[2];
                svgHeight = parts[3];
            }
        } else {
            const bbox = svgEl.getBBox?.();
            if (bbox) {
                svgWidth = bbox.width || svgEl.clientWidth || 800;
                svgHeight = bbox.height || svgEl.clientHeight || 600;
            }
        }

        const rect = containerRef.current.getBoundingClientRect();
        const padding = 60;
        const availW = rect.width - padding * 2;
        const availH = rect.height - padding * 2;

        const fitScale = Math.min(availW / svgWidth, availH / svgHeight, 2);
        setScale(Math.max(fitScale, 0.1));
        setPosition({ x: 0, y: 0 });
    }, []);

    // Auto-fit au chargement
    useEffect(() => {
        if (!svg) return;
        const timer = setTimeout(fitToScreen, 50);
        return () => clearTimeout(timer);
    }, [svg, fitToScreen]);

    // Raccourcis clavier
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s * 1.2, 10));
            if (e.key === "-") setScale((s) => Math.max(s / 1.2, 0.05));
            if (e.key === "0" || e.key.toLowerCase() === "f") fitToScreen();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, fitToScreen]);

    // Zoom molette
    const onWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((s) => Math.min(Math.max(s * factor, 0.05), 10));
    }, []);

    // Drag (souris + tactile)
    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (e.button !== 0 && e.pointerType === "mouse") return;
            e.preventDefault();
            setIsDragging(true);
            dragStart.current = {
                x: e.clientX,
                y: e.clientY,
                posX: position.x,
                posY: position.y,
            };
        },
        [position]
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) return;
            setPosition({
                x: dragStart.current.posX + (e.clientX - dragStart.current.x),
                y: dragStart.current.posY + (e.clientY - dragStart.current.y),
            });
        },
        [isDragging]
    );

    const onPointerUp = useCallback(() => setIsDragging(false), []);

    return createPortal(
        <div
            className="absolute top-0 left-0 right-0 bottom-0 z-[9999] flex flex-col bg-white dark:bg-zinc-950"
            style={{
                width: '100vw',
                height: '100dvh',
                minHeight: '100dvh',
            }}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            {/* Toolbar flottante */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg px-2 py-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setScale((s) => Math.max(s / 1.25, 0.05))}
                >
                    <ZoomOutIcon className="size-4" />
                </Button>

                <div className="w-20 text-center text-sm font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                    {Math.round(scale * 100)}%
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setScale((s) => Math.min(s * 1.25, 10))}
                >
                    <ZoomInIcon className="size-4" />
                </Button>

                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={fitToScreen}
                    title="Adapter (0)"
                >
                    <RotateCcwIcon className="size-4" />
                </Button>

                <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={onClose}
                >
                    <XIcon className="size-4" />
                </Button>
            </div>

            {/* Zone du diagramme */}
            <div
                ref={containerRef}
                className={cn(
                    "flex-1 overflow-hidden flex items-center justify-center select-none",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onWheel={onWheel}
            >
                {!svg && !error && (
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                        <Loader2Icon className="size-10 animate-spin" />
                        <span className="text-sm">Rendu haute qualité...</span>
                    </div>
                )}

                {error && (
                    <div className="text-center p-8 max-w-md">
                        <AlertCircleIcon className="size-12 mx-auto mb-4 text-red-500" />
                        <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-3">
                            Erreur de rendu
                        </p>
                        <pre className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 text-left overflow-auto max-h-48">
                            {error}
                        </pre>
                    </div>
                )}

                {svg && (
                    <div
                        ref={svgRef}
                        className="[&_svg]:block [&_svg]:max-w-none [&_text]:select-none"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: "center center",
                            transition: isDragging ? "none" : "transform 0.1s ease-out",
                        }}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                )}
            </div>
        </div>,
        document.body
    );
};

// Initialisation inline
mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    fontFamily: "inherit",
    securityLevel: "loose",
    legacyMathML: true,
});

interface MermaidDiagramProps {
    readonly code: string;
}

export const MermaidDiagram: FC<MermaidDiagramProps> = ({ code }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const lastCodeRef = useRef<string>("");
    const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!code?.trim()) return;

        if (renderTimeoutRef.current) {
            clearTimeout(renderTimeoutRef.current);
        }

        if (code === lastCodeRef.current && svg) return;

        renderTimeoutRef.current = setTimeout(async () => {
            try {
                // Reset config inline
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "neutral",
                    fontFamily: "inherit",
                    securityLevel: "loose",
                    legacyMathML: true,
                });

                const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const { svg: rendered } = await mermaid.render(id, code.trim());
                setSvg(rendered);
                setError(null);
                lastCodeRef.current = code;
            } catch (err) {
                console.error("Mermaid error:", err);
                setError(err instanceof Error ? err.message : "Erreur");
            }
        }, 250);

        return () => {
            if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
        };
    }, [code, svg]);

    // Loading
    if (!svg && !error) {
        return (
            <div className="my-4">
                <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/20 p-6">
                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Génération...</span>
                </div>
            </div>
        );
    }

    // Error - affiche le code brut au lieu de l'erreur
    if (error && !svg) {
        return (
            <div className="my-4">
                <pre className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground overflow-x-auto">
                    <code>{code}</code>
                </pre>
            </div>
        );
    }

    // Rendu
    return (
        <>
            <div className="my-4 group relative">
                {/* Wrapper scrollable pour mobile - touch-action permet le scroll natif */}
                <div
                    className="overflow-auto overscroll-contain rounded-lg border bg-white dark:bg-zinc-900"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        maxHeight: '70vh',
                        touchAction: 'pan-x pan-y'
                    }}
                >
                    <div
                        ref={containerRef}
                        className="p-4 min-w-max [&_svg]:block [&_svg_a]:pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: svg! }}
                    />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                    className="absolute top-2 right-2 h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm"
                >
                    <Maximize2Icon className="size-3 mr-1" />
                    Agrandir
                </Button>
            </div>

            {isFullscreen && (
                <FullscreenModal code={code} onClose={() => setIsFullscreen(false)} />
            )}
        </>
    );
};