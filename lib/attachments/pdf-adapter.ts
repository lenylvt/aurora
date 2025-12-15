"use client";

import type { AttachmentAdapter, PendingAttachment, CompleteAttachment } from "@assistant-ui/react";

// Import dynamique de PDF.js
let pdfjsLib: any = null;

if (typeof window !== "undefined") {
    import("pdfjs-dist").then((module) => {
        pdfjsLib = module;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    });
}

const MAX_PAGES = 10;

export class PDFAttachmentAdapter implements AttachmentAdapter {
    accept = "application/pdf";

    async add({ file }: { file: File }): Promise<PendingAttachment> {
        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error("PDF trop volumineux (max 10MB)");
        }

        return {
            id: crypto.randomUUID(),
            type: "document",
            name: file.name,
            contentType: "application/pdf",
            file,
            status: { type: "running", reason: "uploading", progress: 0 },
        };
    }

    async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
        const file = attachment.file;
        if (!file) {
            throw new Error("Fichier non trouvé");
        }

        let textContent: string;

        try {
            textContent = await this.extractTextFromPDF(file);
        } catch (error: any) {
            throw new Error(`Erreur lecture PDF: ${error.message}`);
        }

        return {
            id: attachment.id,
            type: "document",
            name: attachment.name,
            contentType: "application/pdf",
            content: [
                {
                    type: "text",
                    text: `[PDF: ${attachment.name}]\n\n${textContent}`,
                },
            ],
            status: { type: "complete" },
        };
    }

    async remove(): Promise<void> {
        // Cleanup if needed
    }

    private async extractTextFromPDF(file: File): Promise<string> {
        // Wait for PDF.js to be loaded
        if (!pdfjsLib) {
            // Try to wait a bit for it to load
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (!pdfjsLib) {
                throw new Error("PDF.js n'est pas encore chargé, réessayez");
            }
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        // Check page limit
        if (pdf.numPages > MAX_PAGES) {
            throw new Error(
                `PDF trop long: ${pdf.numPages} pages. Maximum: ${MAX_PAGES} pages`
            );
        }

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ");
            fullText += `\n--- Page ${i} ---\n${pageText}\n`;
        }

        return fullText.trim();
    }
}
