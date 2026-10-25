// src/career/shareCardImage.ts
//
// Dibuja la imagen para compartir en un canvas y la devuelve como PNG (v0.25.37).
// Usa solo la API de canvas del navegador: sin dependencias ni servidor.

import type { ShareCardContent } from "./shareCard";

const WIDTH = 1200;
const HEIGHT = 630;
const LEFT = 80;
const MAX_TEXT_WIDTH = WIDTH - LEFT * 2;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

// Reduce el tamaño de letra hasta que el texto cabe en una línea.
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize: number): number {
  let size = startSize;
  ctx.font = `bold ${size}px sans-serif`;

  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `bold ${size}px sans-serif`;
  }

  return size;
}

export async function renderShareCardPng(content: ShareCardContent): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, "#16070b");
  background.addColorStop(1, "#2b0710");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#ffe08a";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(content.title, LEFT, 120);

  ctx.fillStyle = "#ffffff";
  const seasonsFont = fitFontSize(ctx, content.seasons, MAX_TEXT_WIDTH, 96, 48);
  ctx.font = `bold ${seasonsFont}px sans-serif`;
  ctx.fillText(content.seasons, LEFT, 250);

  ctx.fillStyle = "#f2d2d7";
  ctx.font = "34px sans-serif";
  const details = [content.points, content.bestLeague, content.lastSeason, ...(content.europe ? [content.europe] : [])];
  let y = 330;
  for (const detail of details) {
    ctx.fillText(detail, LEFT, y);
    y += 56;
  }

  for (const line of wrapText(ctx, content.palmares, MAX_TEXT_WIDTH)) {
    ctx.fillText(line, LEFT, y);
    y += 50;
  }

  ctx.fillStyle = "#ffe08a";
  ctx.font = "26px sans-serif";
  ctx.fillText(content.footer, LEFT, HEIGHT - 60);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen."));
    }, "image/png");
  });
}
