import './styles/global.scss';
import { createApp } from './app/app';

const app = createApp();
document.body.append(app.element);
app.start();

if (import.meta.env.DEV) {
  const { initFigmaOverlay } = await import('./shared/dev/figma-overlay');
  initFigmaOverlay();
}
