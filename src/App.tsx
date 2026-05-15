import { useGame } from './context/GameContext';
import Home from './components/Home';
import TeamSetup from './components/TeamSetup';
import GameBoard from './components/GameBoard';
import QuestionCard from './components/QuestionCard';
import GameOver from './components/GameOver';

export default function App() {
  const { state } = useGame();

  switch (state.phase) {
    case 'home':
      return <Home />;
    case 'team-setup':
      return <TeamSetup />;
    case 'playing':
      return <GameBoard />;
    case 'question':
      return (
        <>
          <GameBoard />
          <QuestionCard />
        </>
      );
    case 'game-over':
      return <GameOver />;
    default:
      return <Home />;
  }
}
