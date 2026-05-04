// PDF 解析服务 - 使用 CDN 版 pdf.js
export interface PDFResult {
  text: string;
  numPages: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

// 动态加载 pdf.js
let pdfjsLib: any = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  // 加载 pdf.js 主库
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.async = true;

  await new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  // 加载 worker
  (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  pdfjsLib = (window as any).pdfjsLib;
  return pdfjsLib;
}

// 解析 PDF 文件
export async function parsePDF(file: File): Promise<PDFResult> {
  const pdfjs = await getPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;

  let fullText = '';
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    fullText += `--- 第 ${i} 页 ---\n${pageText}\n\n`;
  }

  return {
    text: fullText.trim(),
    numPages,
  };
}

// 从 URL 解析 PDF
export async function parsePDFFromUrl(url: string): Promise<PDFResult> {
  const pdfjs = await getPdfJs();

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;

  let fullText = '';
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');

    fullText += `--- 第 ${i} 页 ---\n${pageText}\n\n`;
  }

  return {
    text: fullText.trim(),
    numPages,
  };
}