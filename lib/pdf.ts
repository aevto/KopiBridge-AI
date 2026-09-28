"use client";

interface PdfDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: unknown[] }>;
    getViewport(options: { scale: number }): { width: number; height: number };
    render(options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }): { promise: Promise<void> };
  }>;
  destroy(): Promise<void>;
}

interface PdfJsModule {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(input: { data: ArrayBuffer }): { promise: Promise<PdfDocument> };
}

function isTextItem(item: unknown): item is { str: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof item.str === "string"
  );
}

export async function extractTextFromPdf(file: File) {
  const moduleUrl = "/pdf.mjs";
  const pdfjsLib = (await import(
    /* webpackIgnore: true */ moduleUrl
  )) as PdfJsModule;
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  try {
    if (pdf.numPages > 20)
      throw new Error("Use a resume with no more than 20 pages.");
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (isTextItem(item) ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      pages.push(pageText);
    }

    return pages.join("\n\n").trim();
  } finally {
    await pdf.destroy();
  }
}

export async function resumePageImages(file: File): Promise<string[]> {
  if (file.type !== "application/pdf") {
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return [canvas.toDataURL("image/jpeg", 0.85)];
    } finally {
      bitmap.close();
    }
  }
  const moduleUrl = "/pdf.mjs";
  const pdfjsLib = (await import(
    /* webpackIgnore: true */ moduleUrl
  )) as PdfJsModule;
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() })
    .promise;
  try {
    if (pdf.numPages > 3)
      throw new Error(
        "Image reading supports up to three resume pages. Use a shorter PDF or paste text.",
      );
    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const initial = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(2, 1600 / Math.max(initial.width, initial.height)),
      });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport })
        .promise;
      images.push(canvas.toDataURL("image/jpeg", 0.85));
    }
    return images;
  } finally {
    await pdf.destroy();
  }
}
