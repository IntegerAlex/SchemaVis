/**
 * Export diagram as PNG or SVG using html-to-image.
 */
import { toPng, toSvg } from "html-to-image";

export interface ExportOptions {
  backgroundColor?: string;
  pixelRatio?: number;
}

function getReactFlowElement(): HTMLElement | null {
  return document.querySelector(".react-flow");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadPng(
  diagramName: string,
  options?: ExportOptions,
): Promise<void> {
  const el = getReactFlowElement();
  if (!el) throw new Error("ReactFlow container not found");

  const dataUrl = await toPng(el, {
    backgroundColor: options?.backgroundColor ?? "#0f172a",
    pixelRatio: options?.pixelRatio ?? 2,
    filter: (node) => {
      const name = (node as HTMLElement)?.className ?? "";
      if (typeof name === "string") {
        return (
          !name.includes("react-flow__controls") &&
          !name.includes("react-flow__minimap")
        );
      }
      return true;
    },
  });

  downloadDataUrl(dataUrl, `${diagramName || "schema"}.png`);
}

export async function downloadSvg(
  diagramName: string,
  options?: ExportOptions,
): Promise<void> {
  const el = getReactFlowElement();
  if (!el) throw new Error("ReactFlow container not found");

  const dataUrl = await toSvg(el, {
    backgroundColor: options?.backgroundColor ?? "#0f172a",
    filter: (node) => {
      const name = (node as HTMLElement)?.className ?? "";
      if (typeof name === "string") {
        return (
          !name.includes("react-flow__controls") &&
          !name.includes("react-flow__minimap")
        );
      }
      return true;
    },
  });

  downloadDataUrl(dataUrl, `${diagramName || "schema"}.svg`);
}
