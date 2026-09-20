import './styles/global.scss';
import { createApp } from './app/app';

document.body.append(createApp());

if (import.meta.env.DEV) {
  const { initFigmaOverlay } = await import('./shared/dev/figma-overlay');
  initFigmaOverlay();
}
