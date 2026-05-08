import { useGame } from '../context/GameContext';

export default function GameOver() {
  const { state, dispatch } = useGame();
  const [team1, team2] = state.teams;

  const winner =
    team1.score > team2.score ? team1 : team2.score > team1.score ? team2 : null;

  return (
    <div className="screen gameover-screen">
      <div className="card">
        <h1>🏆 Game Over!</h1>

        <div className="final-scores">
          <div className="final-team" style={{ borderColor: team1.color }}>
            <span className="team-color-dot" style={{ backgroundColor: team1.color }} />
            <span>{team1.name}</span>
            <strong>{team1.score} pts</strong>
          </div>
          <div className="final-team" style={{ borderColor: team2.color }}>
            <span className="team-color-dot" style={{ backgroundColor: team2.color }} />
            <span>{team2.name}</span>
            <strong>{team2.score} pts</strong>
          </div>
        </div>

        {winner ? (
          <p className="winner-text" style={{ color: winner.color }}>
            🎉 {winner.name} wins!
          </p>
        ) : (
          <p className="winner-text">It's a tie! 🤝</p>
        )}

        <button className="btn btn-primary btn-large" onClick={() => dispatch({ type: 'RESET_GAME' })}>
          Play Again
        </button>
      </div>
    </div>
  );
}
