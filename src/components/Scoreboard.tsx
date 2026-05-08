import { useGame } from '../context/GameContext';

export default function Scoreboard() {
  const { state } = useGame();

  return (
    <div className="scoreboard">
      {state.teams.map((team, idx) => (
        <div key={idx} className="scoreboard-team" style={{ borderColor: team.color }}>
          <span className="team-color-dot" style={{ backgroundColor: team.color }} />
          <span className="team-name">{team.name}</span>
          <span className="team-score">{team.score}</span>
        </div>
      ))}
    </div>
  );
}
