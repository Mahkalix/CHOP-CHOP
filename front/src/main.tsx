import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameViewport } from './app/GameViewport';
import { App } from './app/App';
import './styles/global.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameViewport><App /></GameViewport>
  </StrictMode>,
);
