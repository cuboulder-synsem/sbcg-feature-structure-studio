export interface PngExportOptions {
  background?: string;
  filename?: string;
  scale?: number;
}

interface ExportBox {
  width: number;
  height: number;
}

const defaultPngOptions: Required<PngExportOptions> = {
  background: "#ffffff",
  filename: "feature-structure-paper-view.png",
  scale: 2
};

export async function downloadElementAsPng(
  element: HTMLElement,
  options: PngExportOptions = {}
): Promise<string> {
  const pngUrl = await renderElementToPngDataUrl(element, options);
  const anchor = document.createElement("a");
  anchor.href = pngUrl;
  anchor.download = options.filename ?? defaultPngOptions.filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  return pngUrl;
}

export async function renderElementToPngDataUrl(
  element: HTMLElement,
  options: PngExportOptions = {}
): Promise<string> {
  const mergedOptions = { ...defaultPngOptions, ...options };
  const box = getExportBox(element);
  const svgUrl = createElementSvgDataUrl(element, box, collectDocumentStyles());
  const image = await loadImage(svgUrl);
  const canvas = document.createElement("canvas");
  const scale = Math.max(1, mergedOptions.scale);
  canvas.width = Math.ceil(box.width * scale);
  canvas.height = Math.ceil(box.height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("PNG export is unavailable because canvas rendering is not supported.");
  }

  context.scale(scale, scale);
  context.fillStyle = mergedOptions.background;
  context.fillRect(0, 0, box.width, box.height);
  context.drawImage(image, 0, 0, box.width, box.height);
  return canvas.toDataURL("image/png");
}

export function createElementSvgDataUrl(
  element: HTMLElement,
  box = getExportBox(element),
  styleText = ""
): string {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.margin = "0";
  clone.style.width = `${box.width}px`;
  clone.style.minWidth = `${box.width}px`;

  const serializedElement = new XMLSerializer().serializeToString(clone);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}" viewBox="0 0 ${box.width} ${box.height}">`,
    "<defs>",
    `<style>${escapeStyleText(styleText)}</style>`,
    "</defs>",
    `<foreignObject width="100%" height="100%">${serializedElement}</foreignObject>`,
    "</svg>"
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getExportBox(element: HTMLElement): ExportBox {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(1, Math.ceil(element.scrollWidth || rect.width)),
    height: Math.max(1, Math.ceil(element.scrollHeight || rect.height))
  };
}

function collectDocumentStyles(): string {
  return Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not render the paper view as an image."));
    image.src = src;
  });
}

function escapeStyleText(styleText: string): string {
  return styleText.replace(/<\/style/g, "<\\/style");
}
