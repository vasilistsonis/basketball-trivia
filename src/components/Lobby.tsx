import { useGame } from '../context/GameContext';

export default function Lobby() {
  const { state, dispatch } = useGame();

  return (
    <div className="screen lobby-screen">
      <div className="card">
        <h1>🏀 Basketball Trivia</h1>
        <p className="welcome-msg">Welcome, <strong>{state.user?.username}</strong>!</p>
        <button
          className="btn btn-primary btn-large"
          onClick={() => dispatch({ type: 'START_SETUP' })}
        >
          🎮 New Game
        </button>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'LOGOUT' })}>
          Log Out
        </button>
      </div>
    </div>
  );
}
