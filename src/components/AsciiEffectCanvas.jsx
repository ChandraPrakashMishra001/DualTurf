'use client';

import React, { useRef, useEffect } from 'react';

/**
 * 21st.dev ASCII Art / Dither Effect Generator
 * Canvas2D Raster Pipeline
 */
export default function AsciiEffectCanvas({
  srcPhoto = '/images/ftt.jpg',
  renderMode = 'dither',
  bgMode = 'solid',
  bgBlur = 12,
  bgOpacity = 90,
  cellSize = 14,
  coverage = 96,
  invert = false,
  charSet = 'binary',
  brightness = 0,
  contrast = 115,
  edgeEmphasis = 40,
  tint = '#00ff66',
  tintOpacity = 45,
  overlayBlend = 'overlay',
  pfx = {
    vignette: { enabled: true, intensity: 38 },
    scanLines: { enabled: true, intensity: 28 },
    chromatic: { enabled: true, intensity: 40 },
    bloom: { enabled: true, intensity: 60 },
    filmGrain: { enabled: true, intensity: 40 },
    glitch: { enabled: true, intensity: 20 },
  },
  animated = true,
  animStyle = 'flicker',
  animSpeed = { enabled: true, intensity: 100 },
  animIntensity = { enabled: true, intensity: 60 },
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Load source photo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = srcPhoto;

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');

    const handleResize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = Math.floor(rect.width) || 800;
      const h = Math.floor(rect.height) || 500;

      canvas.width = w;
      canvas.height = h;

      const cols = Math.max(1, Math.floor(w / cellSize));
      const rows = Math.max(1, Math.floor(h / cellSize));
      offCanvas.width = cols;
      offCanvas.height = rows;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      if (animated && animSpeed.enabled) {
        time += 0.04 * (animSpeed.intensity / 100);
      }

      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) return;

      const cols = offCanvas.width;
      const rows = offCanvas.height;

      // 1. Draw source photo into offscreen grid
      offCtx.fillStyle = '#050505';
      offCtx.fillRect(0, 0, cols, rows);

      if (img.complete && img.naturalWidth > 0) {
        // Draw photo cropped cover style
        const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
        const x = (cols - img.naturalWidth * scale) / 2;
        const y = (rows - img.naturalHeight * scale) / 2;
        offCtx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
      } else {
        // Fallback dynamic football graphics if image is loading
        const cx = cols / 2;
        const cy = rows / 2;
        const r = Math.min(cols, rows) * 0.4;
        const grad = offCtx.createRadialGradient(cx, cy, 2, cx, cy, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#00ff66');
        grad.addColorStop(1, '#050505');
        offCtx.fillStyle = grad;
        offCtx.beginPath();
        offCtx.arc(cx, cy, r, 0, Math.PI * 2);
        offCtx.fill();
      }

      const imgData = offCtx.getImageData(0, 0, cols, rows);
      const data = imgData.data;

      // 2. Clear main canvas background (Solid / Blurred / Photo)
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      if (img.complete && img.naturalWidth > 0 && bgMode !== 'solid' && bgMode !== 'none') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, bgOpacity / 100));
        if (bgBlur > 0 || bgMode === 'blur') {
          ctx.filter = `blur(${bgBlur || 8}px)`;
        }
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const x = (width - img.naturalWidth * scale) / 2;
        const y = (height - img.naturalHeight * scale) / 2;
        ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
        ctx.restore();
      }

      // Animation Modifier (Flicker / Pulse / Wave)
      let animMod = 1.0;
      if (animated && animIntensity.enabled) {
        const factor = animIntensity.intensity / 100;
        if (animStyle === 'flicker') {
          animMod = 0.85 + (Math.random() * 0.3 - 0.15) * factor;
        } else if (animStyle === 'pulse') {
          animMod = 0.85 + Math.sin(time * 3) * 0.15 * factor;
        } else if (animStyle === 'wave') {
          animMod = 0.9 + Math.sin(time * 5 + cols) * 0.1 * factor;
        }
      }

      // Glitch effect slice
      let glitchRow = -1;
      let glitchShift = 0;
      if (pfx.glitch?.enabled && Math.random() < (pfx.glitch.intensity / 100) * 0.25) {
        glitchRow = Math.floor(Math.random() * rows);
        glitchShift = (Math.random() - 0.5) * 40 * (pfx.glitch.intensity / 100);
      }

      const coverageRatio = coverage / 100;
      const contrastFactor = contrast / 100;

      // 3. Grid Cell Dither & ASCII Rendering
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Coverage skip check
          if (coverageRatio < 1 && (c * 31 + r * 17) % 100 > coverageRatio * 100) {
            continue;
          }

          const idx = (r * cols + c) * 4;
          let red = data[idx];
          let green = data[idx + 1];
          let blue = data[idx + 2];

          // Edge Emphasis (Laplacian neighbor comparison)
          let edgeVal = 0;
          if (edgeEmphasis > 0 && c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
            const leftIdx = (r * cols + (c - 1)) * 4;
            const rightIdx = (r * cols + (c + 1)) * 4;
            const topIdx = ((r - 1) * cols + c) * 4;
            const bottomIdx = ((r + 1) * cols + c) * 4;

            const curLum = 0.299 * red + 0.587 * green + 0.114 * blue;
            const leftLum = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
            const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
            const topLum = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2];
            const bottomLum = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2];

            const diff = Math.abs(curLum * 4 - (leftLum + rightLum + topLum + bottomLum));
            edgeVal = (diff / 255) * (edgeEmphasis / 50);
          }

          // Calculate luminance + Contrast adjustment
          let lum = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          lum = (lum - 0.5) * contrastFactor + 0.5 + brightness / 100;
          lum = Math.max(0, Math.min(1, lum + edgeVal)) * animMod;

          if (invert) lum = 1 - lum;

          let posX = c * cellSize;
          let posY = r * cellSize;

          if (r === glitchRow) {
            posX += glitchShift;
          }

          ctx.save();
          ctx.translate(posX + cellSize / 2, posY + cellSize / 2);

          if (lum > 0.05) {
            const size = Math.min(cellSize * 1.1, cellSize * (lum * 1.25));

            // Tint Blend
            ctx.fillStyle = tint;
            ctx.globalAlpha = Math.min(1, lum * (tintOpacity / 50) + 0.2);

            if (renderMode === 'dither') {
              // Dither Bayer matrix / dot tile
              const ditherPattern = (c + r) % 2 === 0;
              if (ditherPattern || lum > 0.4) {
                ctx.fillRect(-size / 2, -size / 2, size, size);
              } else {
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              // Binary / Character Set glyph
              ctx.font = `800 ${Math.floor(cellSize * 0.85)}px monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const glyph = lum > 0.6 ? '1' : lum > 0.3 ? '0' : '.';
              ctx.fillText(glyph, 0, 0);
            }
          }
          ctx.restore();
        }
      }

      // 4. Post-Effects: Chromatic Aberration
      if (pfx.chromatic?.enabled) {
        const offset = Math.floor((pfx.chromatic.intensity / 100) * 4);
        if (offset > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.15;
          ctx.drawImage(canvas, offset, 0);
          ctx.drawImage(canvas, -offset, 0);
          ctx.restore();
        }
      }

      // 5. Post-Effects: Scanlines
      if (pfx.scanLines?.enabled) {
        const scanAlpha = (pfx.scanLines.intensity / 100) * 0.35;
        ctx.fillStyle = `rgba(0, 0, 0, ${scanAlpha})`;
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 2);
        }
      }

      // 6. Post-Effects: Vignette
      if (pfx.vignette?.enabled) {
        const vigRadius = Math.max(width, height) * 0.75;
        const vigGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          vigRadius * 0.25,
          width / 2,
          height / 2,
          vigRadius
        );
        const vigAlpha = (pfx.vignette.intensity / 100) * 0.9;
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 7. Post-Effects: Film Grain
      if (pfx.filmGrain?.enabled) {
        const grainCount = Math.floor((width * height) / 900);
        ctx.fillStyle = '#ffffff';
        const grainAlpha = (pfx.filmGrain.intensity / 100) * 0.12;
        for (let i = 0; i < grainCount; i++) {
          const gx = Math.random() * width;
          const gy = Math.random() * height;
          ctx.globalAlpha = Math.random() * grainAlpha;
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
        ctx.globalAlpha = 1;
      }

      // 8. Post-Effects: Bloom Radial Glow
      if (pfx.bloom?.enabled) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const bloomGrad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          10,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.5
        );
        const bloomAlpha = (pfx.bloom.intensity / 100) * 0.2;
        bloomGrad.addColorStop(0, `rgba(0, 255, 102, ${bloomAlpha})`);
        bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bloomGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    renderMode,
    bgMode,
    bgBlur,
    bgOpacity,
    cellSize,
    coverage,
    invert,
    brightness,
    contrast,
    edgeEmphasis,
    tint,
    tintOpacity,
    overlayBlend,
    pfx,
    animated,
    animStyle,
    animSpeed,
    animIntensity,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.75,
        zIndex: 0,
      }}
    />
  );
}
