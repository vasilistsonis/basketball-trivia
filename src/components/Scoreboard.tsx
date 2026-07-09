import { useGame } from '../context/GameContext';

export default function Scoreboard() {
  const { state } = useGame();
  const [team1, team2] = state.teams;

  return (
    <div className="scoreboard">
      <div className="sb-team" style={{ '--team-color': team1.color } as React.CSSProperties}>
        <div className="row1">
          <span className="stripe" />
          <span>Team 01</span>
        </div>
        <div className="name">{team1.name}</div>
        <div className="score">{String(team1.score).padStart(2, '0')}</div>
      </div>
      <div className="sb-divider" />
      <div className="sb-team right" style={{ '--team-color': team2.color } as React.CSSProperties}>
        <div className="row1">
          <span>Team 02</span>
          <span className="stripe" />
        </div>
        <div className="name">{team2.name}</div>
        <div className="score">{String(team2.score).padStart(2, '0')}</div>
      </div>
    </div>
  );
}
