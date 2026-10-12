import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Auto-clean an uploaded signature: samples the paper color from the image
 * edges, drops it to transparent, erases notebook ruled lines (long thin
 * horizontal runs, whatever their color or darkness), thickens the surviving
 * strokes by a pixel so thin ballpoint comes out bold, and converts the ink
 * to solid black — faint pen is boosted so it stays visible. Handles
 * dark-ink on light paper as well as light-ink on dark paper. Falls back to
 * the original image if processing fails. Browser-only (canvas).
 */
export function processSignatureImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        if (!img.naturalWidth || !img.naturalHeight) {
          resolve(dataUrl);
          return;
        }
        // Downscale large photos — keeps saved templates small.
        const MAX_W = 800;
        const scale = Math.min(1, MAX_W / img.naturalWidth);
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        // Sample the paper color from a 3px rim around the image edges.
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let samples = 0;
        const rim = 3;
        const samplePaper = (x: number, y: number) => {
          const j = (y * w + x) * 4;
          rSum += d[j];
          gSum += d[j + 1];
          bSum += d[j + 2];
          samples += 1;
        };
        for (let x = 0; x < w; x += 1) {
          for (let k = 0; k < rim; k += 1) {
            samplePaper(x, k);
            samplePaper(x, h - 1 - k);
          }
        }
        for (let y = 0; y < h; y += 1) {
          for (let k = 0; k < rim; k += 1) {
            samplePaper(k, y);
            samplePaper(w - 1 - k, y);
          }
        }
        const bgLum = (rSum + gSum + bSum) / (3 * samples);
        const darkPaper = bgLum < 128;

        // Pass 1: raw ink strength per pixel (0 = paper).
        // Colored notebook ruling (blue/red lines): clearly colored yet not
        // dark, unlike pen ink which is near-neutral or very dark → drop it.
        const TOLERANCE = 10;
        const SPREAD = 50;
        const strength = new Float32Array(w * h);
        const origAlpha = new Float32Array(w * h);
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const idx = y * w + x;
            const i = idx * 4;
            const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
            const spread =
              Math.max(d[i], d[i + 1], d[i + 2]) -
              Math.min(d[i], d[i + 1], d[i + 2]);
            origAlpha[idx] = d[i + 3] / 255;
            if (lum > 100 && spread > 28) continue;
            // Distance from paper: darker-than-paper normally,
            // brighter-than-paper when the paper itself is dark.
            const dist = darkPaper ? lum - bgLum : bgLum - lum;
            strength[idx] = Math.max(0, Math.min(1, (dist - TOLERANCE) / SPREAD));
          }
        }

        // Pass 2: erase long thin horizontal runs = notebook ruled lines,
        // whatever color or darkness they photographed as. Signature strokes
        // are shorter/thicker, so the thinness check spares them.
        const MASK_T = 0.1;
        const erased = new Uint8Array(w * h);
        for (let y = 0; y < h; y += 1) {
          let x = 0;
          while (x < w) {
            while (x < w && strength[y * w + x] <= MASK_T) x += 1;
            const start = x;
            while (x < w && strength[y * w + x] > MASK_T) x += 1;
            if (x - start >= w * 0.6) {
              let near = 0;
              let nearRows = 0;
              for (let yy = Math.max(0, y - 8); yy <= Math.min(h - 1, y + 8); yy += 1) {
                if (Math.abs(yy - y) <= 1) continue;
                let cov = 0;
                let tot = 0;
                for (let xx = start; xx < x; xx += 2) {
                  tot += 1;
                  if (strength[yy * w + xx] > MASK_T) cov += 1;
                }
                if (tot > 0) {
                  near += cov / tot;
                  nearRows += 1;
                }
              }
              if (nearRows > 0 && near / nearRows < 0.35) {
                for (let xx = start; xx < x; xx += 1) erased[y * w + xx] = 1;
              }
            }
          }
        }

        // Pass 2b: dilate surviving ink by 1px so thin ballpoint strokes
        // render bold instead of spindly.
        const grown = new Float32Array(w * h);
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const idx = y * w + x;
            if (erased[idx] || strength[idx] <= 0.25) continue;
            const v = strength[idx];
            for (let dy = -1; dy <= 1; dy += 1) {
              const yy = y + dy;
              if (yy < 0 || yy >= h) continue;
              for (let dx = -1; dx <= 1; dx += 1) {
                const xx = x + dx;
                if (xx < 0 || xx >= w) continue;
                const nIdx = yy * w + xx;
                if (v > grown[nIdx]) grown[nIdx] = v;
              }
            }
          }
        }

        // Pass 3: normalize so the darkest stroke is fully opaque (rescues
        // faint pen), then write black pixels with soft alpha.
        let peak = 0;
        for (let n = 0; n < w * h; n += 1) {
          if (!erased[n] && grown[n] > peak) peak = grown[n];
        }
        const boost = peak > 0.05 ? Math.min(1.8, 0.95 / peak) : 1;
        for (let n = 0; n < w * h; n += 1) {
          const i = n * 4;
          let alpha = 0;
          if (!erased[n] && grown[n] > 0) {
            const v = Math.min(1, grown[n] * boost);
            alpha = Math.round(Math.pow(v, 0.65) * 255 * origAlpha[n]);
          }
          d[i] = 0;
          d[i + 1] = 0;
          d[i + 2] = 0;
          d[i + 3] = alpha;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
