"use client";

// Import dynamique de PDF.js pour éviter les erreurs SSR
let pdfjsLib: any = null;

if (typeof window !== "undefined") {
  import("pdfjs-dist").then((module) => {
    pdfjsLib = module;
    // Utiliser le worker local au lieu du CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  });
}

export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content?: string; // Texte extrait ou base64 pour images
  preview?: string; // URL pour preview
}

/**
 * Traiter une image et la convertir en base64
 */
async function processImage(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        content: base64,
        preview: base64,
      });
    };

    reader.onerror = () => reject(new Error("Erreur lecture image"));
    reader.readAsDataURL(file);
  });
}

/**
 * Extraire le texte d'un PDF (MAX 5 PAGES)
 */
async function processPDF(file: File): Promise<ProcessedFile> {
  try {
    // Vérifier que PDF.js est chargé
    if (!pdfjsLib) {
      throw new Error("PDF.js n'est pas encore chargé, réessayez dans un instant");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // LIMITE: Maximum 5 pages
    if (pdf.numPages > 5) {
      throw new Error(
        `PDF trop long: ${pdf.numPages} pages. Maximum autorisé: 5 pages pour éviter de dépasser les limites de tokens.`
      );
    }

    let fullText = "";

    // Extraire le texte de toutes les pages (max 5)
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content: fullText.trim(),
    };
  } catch (error: any) {
    console.error("Erreur extraction PDF:", error);
    throw error; // Propager l'erreur avec le message d'origine
  }
}

/**
 * Lire le contenu d'un fichier texte
 */
async function processText(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        content: reader.result as string,
      });
    };

    reader.onerror = () => reject(new Error("Erreur lecture fichier texte"));
    reader.readAsText(file);
  });
}

/**
 * Traiter un fichier selon son type
 */
export async function processFile(file: File): Promise<ProcessedFile> {
  // Images
  if (file.type.startsWith("image/")) {
    return processImage(file);
  }

  // PDF
  if (file.type === "application/pdf") {
    return processPDF(file);
  }

  // Fichiers texte
  if (
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    file.type === "application/json"
  ) {
    return processText(file);
  }

  // Documents Word (pour l'instant, on retourne juste le nom)
  if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content: `[Document Word: ${file.name}]`,
    };
  }

  // Type non supporté
  throw new Error(
    `Type de fichier non supporté: ${file.type || "inconnu"}`
  );
}

/**
 * Formater le contenu d'un fichier pour l'envoyer à l'IA
 */
export function formatFileForAI(processedFile: ProcessedFile): string {
  if (processedFile.type.startsWith("image/")) {
    return `[Image: ${processedFile.name}]\n${processedFile.content}`;
  }

  if (processedFile.type === "application/pdf") {
    return `[PDF: ${processedFile.name}]\n${processedFile.content}`;
  }

  return `[Fichier: ${processedFile.name}]\n${processedFile.content}`;
}
