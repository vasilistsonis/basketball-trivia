import { useEffect } from 'react';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useGame } from './context/GameContext';
import Home from './components/Home';
import TeamSetup from './components/TeamSetup';
import GameBoard from './components/GameBoard';
import QuestionCard from './components/QuestionCard';
import GameOver from './components/GameOver';
import { setStatusBar } from './lib/native';

export default function App() {
  const { state } = useGame();
  useEffect(() => {
    const dark = state.phase === 'game-over';
    setStatusBar(dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111111' : '#F2EEE5');
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener('appStateChange', ({ isActive }) => { if (isActive) setStatusBar(dark); });
    return () => { void listener.then(handle => handle.remove()).catch(() => {}); };
  }, [state.phase]);
  useEffect(() => {
    if (state.phase === 'question') return;
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.querySelector<HTMLElement>('[data-screen-title]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.phase]);

  switch (state.phase) {
    case 'team-setup': return <TeamSetup />;
    case 'playing': return <GameBoard />;
    case 'question': return <><GameBoard /><QuestionCard key={state.currentQuestion?.id} /></>;
    case 'game-over': return <GameOver />;
    default: return <Home />;
  }
}
