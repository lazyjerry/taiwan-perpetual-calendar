import { getBackgroundTheme, getGoblinOverlay, type BackgroundTheme } from './goblins';
import { getGoblinPlacement, projectGoblinPlacement } from './goblin-placements';

const goblinSceneScale = 0.34;

const themeFilters: Record<BackgroundTheme, string> = {
  winter: 'drop-shadow(0 8px 13px rgba(20, 30, 38, .3)) saturate(.88) brightness(.96)',
  spring: 'drop-shadow(0 8px 13px rgba(24, 42, 30, .25)) saturate(.92) brightness(1.02)',
  summer: 'drop-shadow(0 8px 13px rgba(18, 38, 32, .28)) saturate(.9) brightness(.98)',
  autumn: 'drop-shadow(0 8px 13px rgba(54, 31, 18, .3)) saturate(.94) sepia(.08)'
};

function mountGoblin(stage: HTMLElement): void {
  if (stage.dataset.goblinMounted === 'true') return;
  const dateKey = stage.dataset.dayPage;
  const figure = stage.querySelector<HTMLElement>('.daily-image');
  const backdrop = figure?.querySelector<HTMLImageElement>('img');
  if (!dateKey || !figure || !backdrop) return;

  stage.dataset.goblinMounted = 'true';
  const goblin = getGoblinOverlay(dateKey);
  const placement = getGoblinPlacement(dateKey);
  const theme = getBackgroundTheme(dateKey);
  const canvas = document.createElement('canvas');
  canvas.className = 'daily-goblin-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;z-index:1;width:100%;height:100%;pointer-events:none';
  figure.append(canvas);

  const image = new Image();
  image.decoding = 'async';
  image.src = goblin.image;

  const draw = () => {
    if (!image.complete || image.naturalWidth === 0 || !backdrop.complete || backdrop.naturalWidth === 0) return;
    const width = figure.clientWidth;
    const height = figure.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const projected = projectGoblinPlacement(
      placement,
      backdrop.naturalWidth,
      backdrop.naturalHeight,
      width,
      height
    );
    const drawHeight = projected.backgroundHeight * goblin.position.scale * goblinSceneScale * placement.scale;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const groundSink = drawHeight * 0.025;

    context.save();
    context.globalAlpha = 0.2;
    context.filter = 'blur(4px)';
    context.fillStyle = '#17261d';
    context.beginPath();
    context.ellipse(projected.x, projected.y + groundSink, drawWidth * 0.3, drawHeight * 0.035, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.save();
    context.globalAlpha = 0.94;
    context.filter = themeFilters[theme];
    context.translate(projected.x, projected.y + groundSink);
    context.scale(placement.x > 0.5 ? -1 : 1, 1);
    context.drawImage(image, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    context.restore();
  };

  image.addEventListener('load', draw, { once: true });
  backdrop.addEventListener('load', draw, { once: true });
  new ResizeObserver(draw).observe(figure);
}

function mountExisting(): void {
  document.querySelectorAll<HTMLElement>('[data-day-page]').forEach(mountGoblin);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountExisting, { once: true });
} else {
  mountExisting();
}

new MutationObserver(mountExisting).observe(document.documentElement, { childList: true, subtree: true });
