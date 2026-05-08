import { useGame } from './context/GameContext';
import Login from './components/Login';
import Lobby from './components/Lobby';
import TeamSetup from './components/TeamSetup';
import GameBoard from './components/GameBoard';
import QuestionCard from './components/QuestionCard';
import GameOver from './components/GameOver';

export default function App() {
  const { state } = useGame();

  switch (state.phase) {
    case 'login':
      return <Login />;
    case 'lobby':
      return <Lobby />;
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
      return <Login />;
  }
}
