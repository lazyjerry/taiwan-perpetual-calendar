import { getBackgroundTheme, getGoblinOverlay, type BackgroundTheme } from './goblins';

const goblinSceneScale = 0.34;

const themeFilters: Record<BackgroundTheme, string> = {
  winter: 'drop-shadow(0 10px 16px rgba(20, 30, 38, .34)) saturate(.88) brightness(.96)',
  spring: 'drop-shadow(0 10px 16px rgba(24, 42, 30, .28)) saturate(.92) brightness(1.02)',
  summer: 'drop-shadow(0 12px 18px rgba(18, 38, 32, .32)) saturate(.9) brightness(.98)',
  autumn: 'drop-shadow(0 12px 18px rgba(54, 31, 18, .34)) saturate(.94) sepia(.08)'
};

function mountGoblin(stage: HTMLElement): void {
  if (stage.dataset.goblinMounted === 'true') return;
  const dateKey = stage.dataset.dayPage;
  const figure = stage.querySelector<HTMLElement>('.daily-image');
  if (!dateKey || !figure) return;

  stage.dataset.goblinMounted = 'true';
  const goblin = getGoblinOverlay(dateKey);
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
    if (!image.complete || image.naturalWidth === 0) return;
    const width = figure.clientWidth;
    const height = figure.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.globalAlpha = 0.94;
    context.filter = themeFilters[theme];

    const drawHeight = height * goblin.position.scale * goblinSceneScale;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const centerX = width * goblin.position.x;
    const bottomY = height * goblin.position.y;
    context.save();
    context.translate(centerX, bottomY);
    context.scale(goblin.position.flip ? -1 : 1, 1);
    context.drawImage(image, -drawWidth / 2, -drawHeight, drawWidth, drawHeight);
    context.restore();
  };

  image.addEventListener('load', draw, { once: true });
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
