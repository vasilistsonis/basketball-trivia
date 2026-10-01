import { useEffect } from 'react';
import { useGame } from './context/GameContext';
import Home from './components/Home';
import TeamSetup from './components/TeamSetup';
import GameBoard from './components/GameBoard';
import QuestionCard from './components/QuestionCard';
import GameOver from './components/GameOver';
import { setStatusBarForDarkScreen } from './native';

export default function App() {
  const { state } = useGame();

  // The results screen is dark; flip the status-bar text to light there.
  useEffect(() => {
    setStatusBarForDarkScreen(state.phase === 'game-over');
  }, [state.phase]);

  switch (state.phase) {
    case 'home':
      return <Home />;
    case 'team-setup':
      return <TeamSetup />;
    case 'playing':
    case 'question':
      // Same tree shape in both phases, so the board stays mounted — and keeps
      // its scores and entrance state — while the question sheet comes and goes.
      return (
        <>
          <GameBoard />
          {state.phase === 'question' && <QuestionCard />}
        </>
      );
    case 'game-over':
      return <GameOver />;
    default:
      return <Home />;
  }
}
